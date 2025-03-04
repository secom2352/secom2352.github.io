import { ArrayEqual, ArrayFilter, ArrayRemove, moreThan, inRect, isASCII, copyDict, defaultDict } from "../tool.js";
import { defaultStyle, getRelPos } from "../ui/base.js";
import { Align, Br,Char,HrLine,Image, stringToTDict, TElementRegistry, teToString } from "./telement.js";
class RectBlock{
    constructor(tblock,rect){
        this.tblock=tblock;
        this.setBlock(rect);
        //this.tblock.minHeight=this.block[3]+this.tblock.lineSpace;
    }
    setBlock(block){
        this.xrange=[block[0]-1,block[0]+block[2]+1];
        this.yrange=[block[1]-1,block[1]+block[3]+1];
        this.initPos=[block[0],block[1]];
        this.block=block;
        this.tblock.trigger_event('setblock',block);
    }
    inDomain(Rect){       //自身是否在某 Rect 之內
        return inRect(this.block,Rect);
    }
    //--------------------------------------------------------- 在範圍之內
    inWidth(rect){
        return this.xrange[0]<rect[0] && rect[0]+rect[2]<this.xrange[1];
    }
    inHeight(rect){
        return this.yrange[0]<rect[1] && rect[1]+rect[3]<this.yrange[1];
    }
    inblock(rect){
        return this.inWidth(rect) && this.inHeight(rect);
    }
    //--------------------------------------------------------- 取得空間
    getVoidPos(rect,lineSpace=0){
        if(rect[0]<=this.initPos[0]) return [this.initPos[0],rect[1]];
        if(this.inWidth(rect)) return [rect[0],rect[1]];
        if(this.allowChangeLine)
            return [this.initPos[0],rect[1]+rect[3]+lineSpace];
        return null;
    }
    getLineStartX(pos){        //取得某座標下的起始 x
        return this.block[0];
    }
    getLineEndX(pos){          //取得某座標下的結尾 x
        return this.block[0]+this.block[2];
    }
    getLineWidth(pos){        //取得某座標下的行寬
        return this.block[2];
    }
    //--------------------------------------------------------- 開始排列
    arrange(){
        //==========================================================調用常數
        let tblock=this.tblock;
        let relObjs=tblock.relObjs;
        let lineSpace=tblock.lineSpace;
        //-----------------------------------自身左右
        let startX=this.block[0];
        let blockWidth=this.block[2];
        let endX=this.block[0]+this.block[2];
        //==========================================================運算參數
        //---------------------------------------------總參數
        let isFisrtBr=true;
        let k=0;const n=relObjs.length;
        let y=this.block[1]+lineSpace;   //每列的 y 座標
        let width=0;  //排列後要包含所有元素需要的最小寬度
        let height=lineSpace;
        //-----------------------------------------------單列參數
        //=========================================================================== 總計算
        while (k<n){
            //-------------------------------------------------------單列計算
            let lineHeight=tblock.lineHeight;
            let p=k;    //--------k 為 單列起點
            let xpos=[startX];  //[第一物件的X,......,該列最後可排物件的X,無法排入物件的X(該列最右X)];
            let testX=startX;
            while(k<n){
                let baseObj=relObjs[k];
                if(baseObj.type=='align'){
                    testX=baseObj.getAlignX([testX,y],k);
                    xpos[xpos.length-1]=testX;
                }
                testX+=baseObj.size[0];
                if(testX>endX){   //如果超寬
                    if(!tblock.allowOverWidth || moreThan(testX,tblock.limitRect[2])){  //若不允許超出寬度
                        if(!tblock.allowChangeLine){
                            console.log('寬度無法塞入');
                            return false;
                        }
                        if(xpos.length>1) break;  //該物件需排在下一行
                        else{
                            console.log('超寬，強制排入');
                            testX=endX;      //設置為最大寬度
                        }
                    }
                }
                if(baseObj.type=='br' && (xpos.length>1 || isFisrtBr) && tblock.allowChangeLine){
                    break; //這非該行的第一個br，此br後需排在下一行
                }
                xpos.push(testX);  //將下一個 baseObj 該排在的 X 座標
                lineHeight=Math.max(baseObj.size[1],lineHeight);
                k++;
            }
            //-----------------------------------更新寬高
            width=Math.max(width,xpos[xpos.length-1]-startX);
            height+=lineHeight;
            if(moreThan(y+lineHeight,tblock.limitRect[3])){
                console.log('高度無法塞入');
                return false;
            }
            //-----------------------------------開始設置
            if(isFisrtBr) isFisrtBr=false;
            for(let i=p;i<k;i++){
                let baseObj=relObjs[i];
                //--------------------------------------------------------判斷這個位置有沒有問題
                baseObj.setPos([xpos[i-p],y+lineHeight-baseObj.size[1]]);  //向下對齊
            }
            //-----------------------------------更新座標
            y+=lineHeight+lineSpace;
            if(k<n) height+=lineSpace;
        }
        if(tblock.autoFitSize){
            let newblock=[this.block[0],this.block[1],Math.max(tblock.limitRect[0],width),Math.max(tblock.limitRect[1],height)];
            if(tblock.limitRect[2]!=null) newblock[2]=Math.min(newblock[2],tblock.limitRect[2]);
            if(tblock.limitRect[3]!=null) newblock[3]=Math.min(newblock[3],tblock.limitRect[3]);
            if(!ArrayEqual(newblock,this.block)){
                this.setBlock(newblock);
            }
        }
        return true;
    }
}
class AnyBlock{
    constructor(tblock,block){
        this.tblock=tblock;
        this.block=block;
    }
    inblock(rect){}
}

export class TBlock{          //內部描述區塊
    constructor(tmodel,block,lineHeight=30,lineSpace=6){
        this.tmodel=tmodel;
        this.tcontrol=tmodel.tcontrol;
        this.lineHeight=lineHeight;     //行高
        this.lineSpace=lineSpace;       //行距
        //------------------------------------------------------------------------------物件
        this.relObjs=[];
        this.absObjs=[];
        this.brs=[];                  //放置 Br物件 用來快速跳行
        //------------------------------------------------------------------------------換行
        this.auto_changeline=true;    //自動換行
        this.line_space=6;            //行距
        //------------------------------------------------------------------------------常用參數
        this.isFocus=false;           //只要被鎖定，就一直是 true
        this.events={};
        //-----------------滑鼠
        this.mousePressing=false;     //只有自身被按下期間是 true
        this.index=0;
        this.selecting=[0,0];
        //-----------------歷史紀錄
        this.history=[];            //修改內容，[最前index,原TeString,新TeString,(atype='rel')]
        this.hindex=-1;             //目前的階段
        this.modifyn=0;             //從上一次被focus後，被改了幾次
        this._recordHistory=true;   //是否記錄
        //------------------------------------------------------------------------------特殊屬性
        this.allowInputTypes=null;       //允許輸入的物件型態，null代表全部允許
        this.allowOverWidth=false;       /*允許輸入的元素突破邊界
                                           true :超出寬度->直接超出
                                           false:超出寬度->若允許換行，將自動換行;否則退回上一步
                                           */
        this.allowOverHeight=true;      /*允許輸入的元素突破邊界
                                           true :超出高度->直接超出
                                           false:超出高度->退回上一步
                                           */
        this.allowChangeLine=true;       /*允許在任意情況下，[換行]這個行為
                                           true :元素超出寬度時允許換行、允許 Br 物件換行
                                           false:元素超出寬度且不可overflow時，退回上一步、Br無效
                                           */
        this.autoFitSize=false;          //自動依據元素排列調整自身寬高，限制在 limitRect 的範圍中
        this.limitRect=[0,0,null,null];  // minW,minH,maxW,maxH
        //------------------------------------------------------------------------------輸入模式
        this.input_funcs={};
        this.input_mode='text';
        let tblock=this;
        this.addInputMethod('text',(char)=>{return {'type':'char','char':char,'fontHeight':'30'};}); 
        this.inp_color='black';     //輸入指標顏色
        //-------------------------------------------------------- Composing 文字
        this.isComposing=false;  //是否編譯中
        this.composingIndex=0;   //編譯開始前指針
        this.composingBox=[];    //編譯中箱子[[字,baseObj],...]
        //-------------------------------------------------------- 設定block
        this.setBlock(block);
    }
    //===================================================================================== Block
    setBlock(block,limitRect=null){
        if(typeof block[0]=='number')
            this.block=new RectBlock(this,block);
        else this.block=new AnyBlock(this,block);
        if(limitRect!=null) this.limitRect=limitRect;
        else this.limitRect=[block[2],block[3],null,null];
        this.arrange();
    }
    getLineWidth(pos){
        return this.block.getLineWidth(pos);
    }
    getBlock(){
        return this.block.block;
    }
    //=====================================================================================輸入法
    setInputMethod(inputMethod){
        this.input_mode=inputMethod;
    }
    addInputMethod(inputMethod,charFunc,setMethod=false){
        this.input_funcs[inputMethod]=charFunc;
        if(setMethod) this.input_mode=inputMethod;
    }
    InputConvert(value,_mdict=null,input_mode=null){           // 輸入文字轉換
        if(input_mode==null) input_mode=this.input_mode;
        let bdict=this.input_funcs[this.input_mode](value);
        if(_mdict!=null) Object.assign(bdict,_mdict);
        return bdict;
    }
    //=====================================================================================添加與管理物件
    typeIsAllowed(baseObjType){
        return this.allowInputTypes==null || this.allowInputTypes.includes(baseObjType);
    }
    insertObj(index,bdict){
        this.index=index;
        return this.addObj(bdict,'rel');
    }
    addObj(bdict,atype='rel'){
        if(this.typeIsAllowed(bdict['type'])){
            let classObj=TElementRegistry[bdict['type']];
            if(classObj!=undefined){
                let baseObj=new classObj[0](this,bdict);
                if(atype=='rel'){
                    this.relObjs.splice(this.index,0,baseObj);
                    //====================================================================特殊插入物件
                    if(baseObj.type=='br'){
                        let tblock=this;
                        baseObj.addEvent('destroy',()=>{ArrayRemove(tblock.brs,baseObj);});
                        //----------------------插入 brs
                        let insertBr=false;
                        let _bindex=this.index;
                        for(let i=0;i<this.brs.length;i++){
                            let bindex=this.getObjIndex(this.brs[i]);
                            if(bindex>_bindex){
                                this.brs.splice(i,0,baseObj);
                                insertBr=true;
                                break;
                            }
                        }
                        if(!insertBr) this.brs.push(baseObj);
                    }
                    //====================================================================
                    this.index++;
                }else this.absObjs.push(baseObj);
                //this.recordHistory();
                return baseObj;
            }else console.log(bdict['type']+'型別未在登記表中');
        }
        return null;  //代表創建失敗
    }
    addObjs(bdicts,atype='rel'){
        if(!Array.isArray(bdicts)) bdicts=[bdicts];
        for(let i=0;i<bdicts.length;i++) this.addObj(bdicts[i],atype);
    }
    getObjIndex(baseObj){
        return this.relObjs.indexOf(baseObj);
    }
    removeObj(baseObj){
        if(this.relObjs.includes(baseObj)) this.relObjs=ArrayFilter(this.relObjs,baseObj);
        if(this.absObjs.includes(baseObj)) this.absObjs=ArrayFilter(this.absObjs,baseObj);
        baseObj.destroy();
        if(this.index>this.relObjs.length) this.index=this.relObjs.length;
    }
    changeObjType(baseObj,atype){}
    destroy(){
        this.clear();
    }
    //=====================================================================================事件
    trigger_event(eventname,event){
        let events=this.events[eventname];
        if(events){
            for(let i=0;i<events.length;i++)
                events[i][1](event);
        }
    }
    newEvent(eventnameList){     //添加新事件集
        if(typeof eventnameList=="string") eventnameList=[eventnameList];
        for(let i=0;i<eventnameList.length;i++){
            let eventname=eventnameList[i];
            this.events[eventname]=[];
        }
    }
    addEvent(eventname,callback,id=null){
        if(this.events[eventname]==undefined) this.newEvent(eventname);
        this.events[eventname].push([id,callback]);
    }
    //=================================================================滑鼠事件(視為真實點按)
    onmousedown(relPos,event){
        this.isFocus=this.tcontrol.acquirefocus(this);
        if(this.isFocus){
            let inp=this.tcontrol.inp;
            inp.setInputColor(this.inp_color);    //設定 inp 顏色
            let index=this.tap(relPos);
            this.mousePressing=true;
            if(inp.shiftKey){
                this.selecting[0]=this.index;
                this.selecting[1]=index;
                this.render_selection();
            }else this.selecting[0]=index;
            this.index=index;
            this.trigger_event('onmousedown',event);
            return this.index;
        }
        return null;
    }
    onmousemove(relPos,event,mouseup=false){   //show_deal: 是否 顯示 對被選定的物件操作框
        if(this.block.inblock([relPos[0],relPos[1],0,0]) && this.mousePressing){
            if(this.isFocus){
                this.index=this.tap(relPos);
                this.selecting[1]=this.index;
                this.render_selection();
                //if(show_deal && this.selecting[0]==this.selecting[1]){
                    //------------------顯示[輸入游標]並閃爍
                this.show_inp();
                //}
                if(mouseup){
                    this.trigger_event('onmouseup',event);
                    if(this.selecting[0]!=this.selecting[1]) this.trigger_event('selectup',event);
                }
                else this.trigger_event('onmousemove',event);
            }else if(this.tcontrol.nowtmodel==this.tmodel){    //-----------進行[表格邊框]選定
                if(mouseup){}
            }
        }
    }
    onmouseup(relPos,event){
        this.onmousemove(relPos,event,true);
        this.mousePressing=false;
    }
    //=================================================================鍵盤事件(視為真實點按)
    keydown(event){
        if (event.ctrlKey) {                     // ctrl 事件
            if(this.selecting[0]!=this.selecting[1]){
                if(event.code=='KeyC'){this.copy();
                }else if(event.code=='KeyX'){
                    this.cut();this.selecting[0]=this.selecting[1];
                }
            }
            if(event.code=='KeyA'){this.select();
            }else if(event.code=='KeyZ'){
                //if(event.shiftKey) this.forward();
                //else this.back();
            }
        }
        let br_index;let refer_xObj;
        let selecting=[Math.min(...this.selecting),Math.max(...this.selecting)];
        switch(event.code){
            //----------------------------方向鍵
            case 'ArrowLeft':
                if(selecting[0]!=selecting[1]){
                    this.index=selecting[0];this.render_selection(true);
                }else this.index=Math.max(0,this.index-1);
                break;
            case 'ArrowRight':
                if(selecting[0]!=selecting[1]){
                    this.index=selecting[1];this.render_selection(true);
                }else this.index=Math.min(this.relObjs.length,this.index+1);
                break;
            case 'ArrowUp':
                if(!this.isComposing){
                    br_index=this.find_telement('br',-1,this.index-1);
                    if(br_index<1) this.index=0;   //代表目前 index 在第一行 或 第一行為br
                    else{
                        refer_xObj=this.relObjs[this.index-1];
                        let refer_yObj=this.relObjs[br_index-1];
                        this.index=this.tap([refer_xObj.pos[0]+refer_xObj.size[0],refer_yObj.pos[1]+refer_yObj.size[1]/2]);
                    }
                }
                break;
            case 'ArrowDown':
                if(!this.isComposing){
                    br_index=this.find_telement('br',1,this.index);
                    if(br_index>=this.relObjs.length) this.index=this.relObjs.length;
                    else{
                        let refer_yObj=this.relObjs[br_index];
                        if(this.index==0){
                            refer_xObj=this.relObjs[0];
                            this.index=this.tap([refer_xObj.pos[0],refer_yObj.pos[1]+refer_yObj.size[1]/2]);
                        }else{
                            refer_xObj=this.relObjs[this.index-1];
                            this.index=this.tap([refer_xObj.pos[0]+refer_xObj.size[0],refer_yObj.pos[1]+refer_yObj.size[1]/2]);
                        }
                    }
                }
                break;
            case 'Backspace':
                if(!this.isComposing){
                    if(!this.delete(selecting[0],selecting[1])){
                        if(this.index>0) this.delete(this.index-1);
                    }this.arrange();
                }
                break;
            case 'Delete':
                if(!this.isComposing){
                    if(!this.delete(selecting[0],selecting[1])){
                        this.delete();
                    }this.arrange();
                }
                break;
            //----------------------------換行
            case 'Enter':
                if(!this.isComposing){
                    this.changeLine();this.arrange();
                }
                break;
        }
        this.trigger_event('keydown',event);
        if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Backspace','Delete','Enter'].includes(event.code))
            this.show_inp();
    }
    input(event){
        //--------------------------------------選擇檢查
        if(this.selecting[0]!=this.selecting[1]){
            this.delete(Math.min(...this.selecting),Math.max(...this.selecting));
            this.selecting=[this.index,this.index];
            this.tcontrol.hideAuxiliary();
        }
        //--------------------------------------繼承屬性
        let tblock=this;
        function charDict(char){
            return defaultDict(tblock.InputConvert(char),copyDict(inherit_dict));
        }
        let inheritTek=this.find_telement(this.input_mode,-1,this.index-1);
        let inherit_dict={};
        if(-1<inheritTek && inheritTek<this.relObjs.length)
            inherit_dict=this.relObjs[inheritTek].getDict();
        //---------------------------------------輸入處理
        let value=this.tcontrol.inp.value;               // inp 的全 value
        if((!event.isComposing && isASCII(value))){      //直接英文輸入
            let bdict=charDict(value);  //字元轉 baseObj
            this.addObj(bdict,'rel');
            this.tcontrol.inp.clear();
        }else if(event.isComposing){
            if(!this.isComposing){
                this.isComposing=true;
                this.composingIndex=this.index;
            }
            //let inheritTek=this.find_telement(this.input_mode,-1,this.composingIndex-1);
            //let inherit_dict={'border-bottom':'1px dashed #000'};
            //if(-1<inheritTek && inheritTek<this.relObjs.length)
            //    Object.assign(inherit_dict,this.relObjs[inheritTek].getDict());
            //--------------------------------目標: composingBox 與 value 一樣長
            let i=0;       //逐字比較
            while (i<value.length){
                if(this.composingBox.length<=i){     //若 value 超過 composingBox 的長度
                    let baseObj=this.insertObj(this.composingIndex+i,charDict(value[i]));
                    if(baseObj!=null){
                        this.composingBox.push([value[i],baseObj]);
                    }
                    i++;
                }else if(this.composingBox[i][0]!=value[i]){     //可能是 value中段被刪除 或 value中段被新增
                    if(value.length>this.composingBox.length){   //value中段被新增
                        let baseObj=this.insertObj(this.composingIndex+i,charDict(value[i]));
                        this.composingBox.splice(i,0,[value[i],baseObj]);
                        i++;
                    }else if(value.length<this.composingBox.length){
                        this.removeObj(this.composingBox[i][1]);this.composingBox.splice(i,1);
                        this.index=this.composingIndex+i;
                    }else{
                        this.removeObj(this.composingBox[i][1]);
                        let baseObj=this.insertObj(this.composingIndex+i,charDict(value[i]));
                        this.composingBox[i]=[value[i],baseObj];
                    }
                }else i++;
            }
            if(i<this.composingBox.length){  //代表後節文字被刪除
                for(;i<this.composingBox.length;i++) this.removeObj(this.composingBox[i][1]);
                this.composingBox=this.composingBox.slice(0,value.length);
                this.index=this.composingIndex+value.length;
            }
            for(let u=0;u<this.composingBox.length;u++) this.composingBox[u][1].setDict({'DU':'1'});
        }
        this.trigger_event('input',event);
        this.ashow_inp();
    }
    keyup(event){
        if (!event.isComposing && this.composingBox.length>0) { //event.code == 'Enter' || 
            for(let i=0;i<this.composingBox.length;i++)
                this.composingBox[i][1].setDict({'DU':'0'});
            this.index=this.composingIndex+this.composingBox.length;
            this.composingBox=[];
            this.tcontrol.inp.clear();
            this.isComposing=false;
            this.tmodel.renderData();
            this.show_inp();
        }else if(this.composingBox.length==0)
            this.show_inp();
        this.trigger_event('keyup',event);
    }
    //=====================================================================================內容屬性變更
    select(is_selected=true){                         //全選
        if(is_selected){
            this.index=this.relObjs.length;
            this.selecting=[0,this.index];
        }else this.selecting[0]=this.selecting[1];
        this.render_selection();
    }
    render_selection(reset=false){
        if(reset) this.selecting=[this.index,this.index];
        let selecting=[Math.min(...this.selecting),Math.max(...this.selecting)];
        //let se=this.getDisplayRange();
        for(let i=0;i<this.relObjs.length;i++){
            this.relObjs[i].select(i>=selecting[0] && i<selecting[1]);
        }
        this.tmodel.renderData();
    }
    getSelection(){
        let selecting=[Math.min(...this.selecting),Math.max(...this.selecting)];
        return this.relObjs.slice(selecting[0],selecting[1]);
    }
    //=====================================================================================尋找 & 取得資訊
    find_telement(tetypes,direct=-1,index=null){ //tetypes:要找的型態們, direct:找的方向, index:從指定位置(含)開始找
        if(index==null) index=this.index;
        if(typeof tetypes=="string") tetypes=[tetypes];
        let k=index;
        while (-1<k && k<this.relObjs.length){
            if(tetypes.includes(this.relObjs[k].type))
                return k;
            k+=direct;
        }
        //向左找不到，return -1; 向右找不到，return 總長度
        return k;
    }
    tap(relPos,getTelement=false){          //relPos 為 [鼠標]相對於[ _element 左上角]的 pos，回傳 index 無視 relPos 有無在 block 中
        //-----------------------rel
        let x=relPos[0];let y=relPos[1];
        let relObjs=this.relObjs;
        if(relObjs.length==0)     //如果沒有元素
            return 0;
        if(y<relObjs[0].pos[1])   //第一元素
            return 0;
        let fit_y=[null,null];        //y座標符合且最接近的,分數  //先找到最接近y
        let se=this.getDisplayRange();
        for(let i=se[0];i<se[1];i++){
            let baseObj=relObjs[i];
            //if (telement.type=='br') continue;
            let rect=baseObj.getrect();
            if(y>=rect[1]-this.lineSpace && y<rect[1]+rect[3]){     //代表y符合
                if(x>=rect[0] && x<rect[0]+rect[2]){     //代表x符合
                    if(getTelement)
                        return baseObj;
                    //if(is_selected && i>=this.selecting[0] && i<this.selecting[1])
                      //  return 'yes';
                    if(x>rect[0]+rect[2]/2)
                        return i+1;
                    return i;
                }
                let score=Math.abs(x-(rect[0]+rect[2]/2));
                if (fit_y[1]==null || score<fit_y[1]){
                    if(x>rect[0]+rect[2]/2)
                        fit_y=[i+1,score];
                    else fit_y=[i,score];
                }
            }
        }
        if(getTelement) return null;
        if(fit_y[0]!=null)
            return fit_y[0];
        return this.relObjs.length;
    }
    //=====================================================================================排列與顯示
    touchAbsObj(rect){      //是否撞到絕對物件
        return false;
    }
    getDisplayRange(Rect=null){
        if(Rect==null) Rect=this.tmodel.getDisplayRect();
        let si=0;let ei=this.relObjs.length;   //渲染第一行與最後一行
        //找尋第一個br
        for(let i=0;i<this.brs.length;i++){
            let br=this.brs[i];
            if(si==0 && inRect(br.getrect(),Rect)){
                si=this.getObjIndex(br);
            }
            if(si!=0 && !inRect(br.getrect(),Rect)){
                if(i+1<this.brs.length) ei=this.getObjIndex(this.brs[i+1]);
                break;
            }
        }
        if(this.relObjs.length>0 && inRect(this.relObjs[0].getrect(),Rect)) si=0;
        return [si,ei];
    }
    arrange(render=true){              //重新定位 所有relObjs 的座標
        this.block.arrange();
        if(render) this.tmodel.renderData();
    }
    render(Rect){             // 將自身內容繪製在 tmodel 上
        //if(this.tmodel==this.tcontrol.mtmodel){
        //    console.log('Rect:',Rect);
        //}
        if(this.block.inDomain(Rect)){
            let se=this.getDisplayRange(Rect);
            //找尋最後
            for(let i=se[0];i<se[1];i++){
                let baseObj=this.relObjs[i];
                baseObj.render();
            }
        }
    }
    show_inp(){              //------------------------顯示 tcontrol 的 inp 至自身指定位置
        let inp=this.tcontrol.inp;
        let relPos=this.tmodel.pos;
        let hideInp=false;
        if(this.relObjs.length==0 || (this.index==0 && ['br','align'].includes(this.relObjs[0].type))){       //首位
            inp.setPos([relPos[0]+this.block.initPos[0]-2,relPos[1]+this.block.initPos[1]-2]);
            inp.setInputHeight(this.lineHeight);
        }else{
            //---------------------------依據上一個 char 設定 input 高度
            let hk=this.find_telement(this.input_mode,-1,this.index-1);
            let brk=this.find_telement('br',-1,this.index-1);
            if(-1<hk && hk<this.relObjs.length && brk<hk)
                inp.setInputHeight(this.relObjs[hk].size[1]);
            else inp.setInputHeight(this.lineHeight);
            //---------------------------依據上一個元素設定位置
            if(this.index>=this.relObjs.length) this.index=this.relObjs.length;
            //let baseObj;
            let drect;
            if(this.index==0 || ( this.relObjs[this.index-1].type=='br'
                && this.index<this.relObjs.length && !['br','align'].includes(this.relObjs[this.index].type))){  //取右
                drect=this.relObjs[this.index].getDisplayRect();
                inp.setPos([relPos[0]+drect[0]-2,relPos[1]+drect[1]+drect[3]-inp.size[1]]);
            }else{             //-------------------------------------------------------------取左               
                drect=this.relObjs[this.index-1].getDisplayRect();
                if(drect[0]>this.tmodel.size[0]) hideInp=true;
                inp.setPos([relPos[0]+drect[0]+drect[2]-2*this.tmodel.devicePixelRatio,
                    relPos[1]+drect[1]+drect[3]-inp.size[1]]);
            }
        }
        if(hideInp) inp.hide();
        else{
            inp.show();
            if(!this.isComposing)
                inp.focus();
        } 
    }
    ashow_inp(){this.arrange();this.show_inp();}
    //=========================================================================操作事件，結束後不會「重新排列」
    //-----------------------------------------------------------------基本
    clear(){
        this.delete(0,this.relObjs.length);
    }
    delete(index=null,index2=null){
        if(index==null) index=this.index;
        if(index2==null) index2=index+1;
        if(index>=index2) return false;
        if(index>=this.relObjs.length) return false;
        //------------------------------------------------開始刪除
        //if(this.update_history)
          //  this.record_history('D',index,index2);
        if(-1<index && index<this.relObjs.length){
            let times=index2-index;
            for (let i=0;i<times;i++) this.relObjs[index+i].destroy();
            this.relObjs.splice(index,times);
            this.selecting[1]=this.selecting[0];
        }
        //-------------------------------------------------檢查br和line_space
        this.index=index;
        //this.update_align();
        return true;
    }
    changeLine(index=null){
        if(!this.allowChangeLine) return;
        if(index!=null) this.index=index;
        this.addObj({'type':'br','lineHeight':this.lineHeight});
    }
    cut(range=null){
        if(range==null) range=this.selecting;
        this.copy(range);
        this.delete(range[0],range[1]);
        this.ashow_inp();
    }
    copy(range=null){
        if(range==null) range=this.selecting;
        range=[Math.min(...range),Math.max(...range)];
        let stringlist=[];
        for(let i=range[0];i<range[1];i++){
            stringlist.push(this.relObjs[i].text);
        }
        let copyTeString=this.copyTeString(range[0],range[1]);
        let string=stringlist.join('');
        if(range[1]-range[0]>0){
            this.tcontrol.copy_string=string;
            this.tcontrol.copyTeString=copyTeString;
        }
        navigator.clipboard.writeText(string);
        return string;
    }
    paste(pastedData=null,index=null){
        //if(pastedData==null) pastedData=this.tcontrol.copy_string;
        if(index!=null) this.index=index;
        pastedData=pastedData.replace(/\r/g,'');
        let copy_string=this.tcontrol.copy_string;
        if(pastedData==copy_string){
            console.log('符合');
            this.inputTeString(this.tcontrol.copyTeString);
        }else this.inputText(pastedData);
        this.ashow_inp();
    }
    //-----------------------------------------------------------------儲存格式
    copyTeString(index1,index2){
        return teToString(this.relObjs.slice(index1,index2));
    }
    inputTeString(teString){
        let dbox=stringToTDict(teString);
        this.addObjs(dbox,'rel');
    }
    ToTeString(){
        return teToString(this.relObjs);
    }
    LoadTeString(teString){
        this.clear();
        this.inputTeString(teString);
    }
    //==================================================================輸入
    inputTElements(telement_bdicts){
        return this.addObjs(telement_bdicts);
    }
    inputText(text=''){
        for(let i=0;i<text.length;i++){
            if(text[i]=='\n') this.changeLine();
            else this.addObj(this.InputConvert(text[i]));
        }
    }
    insertImage(src,_dict=null){
        _dict=defaultStyle(_dict,{'type':'image','src':src,'maxWidth':this.block.getLineWidth()/2,'errorSrc':'image/image-not-found.png'});
        this.addObj(_dict,'rel');
    }
    setAlign(align,ratio='align'){
        // align=left,center,rght
        // ratio='align':根據align左中右設置; 'auto':定位至當前位置
        let adict={'type':'align','align':align,'ratio':ratio};
        if(ratio=='auto') adict['adjust']='1';
        this.addObj(adict,'rel');
    }
    setHrLine(lineHeight){
        this.changeLine();
        this.addObj({'type':'hrline','lineHeight':lineHeight});
        this.changeLine();
    }
    insertRectIBox(){         //插入方形輸入框
        return this.addObj({'type':'rectibox'});
    }

    //================================================================== 取得值
    getText(chartype='char',charkey='char'){
        let namebox=[];
        let relObjs=this.relObjs;
        for(let i=0;i<relObjs.length;i++){
            if(relObjs[i].type==chartype) namebox.push(relObjs[i].bdict[charkey]);
        }
        return namebox.join('');
    }
}