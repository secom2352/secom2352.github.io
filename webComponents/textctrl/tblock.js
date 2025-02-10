import { ArrayFilter, ArrayRemove, inRect, isASCII } from "../tool.js";
import { defaultStyle, getRelPos } from "../ui/base.js";
import { Align, Br,Char,Image, stringToTDict, TElementRegistry, teToString } from "./telement.js";
class RectBlock{
    constructor(rect){
        this.setBlock(rect);
        this.enableChangeLine=true;      //允許自動換行
        this.enableExtendWidth=false;    //允許拓展寬度
        this.enableExtendHeight=true;    //允許拓展高度
    }
    setBlock(block){
        this.xrange=[block[0]-1,block[0]+block[2]+1];
        this.yrange=[block[1]-1,block[1]+block[3]+1];
        this.initPos=[block[0],block[1]];
        this.block=block;
    }
    inDomain(Rect){       //自身是否在某 Rect 之內
        return inRect(this.block,Rect);
    }
    //---------------------------------------------------------在範圍之內
    inWidth(rect){
        return this.xrange[0]<rect[0] && rect[0]+rect[2]<this.xrange[1];
    }
    inHeight(rect){
        return this.yrange[0]<rect[1] && rect[1]+rect[3]<this.yrange[1];
    }
    inblock(rect){
        return this.inWidth(rect) && this.inHeight(rect);
    }
    //---------------------------------------------------------取得空間
    getVoidPos(rect,lineSpace=0){
        if(rect[0]<=this.initPos[0]) return [this.initPos[0],rect[1]];
        if(this.inWidth(rect)) return [rect[0],rect[1]];
        if(this.enableChangeLine)
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
}
class AnyBlock{
    constructor(block){
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
        //--------------------------------------------------------物件
        this.relObjs=[];
        this.absObjs=[];
        this.brs=[];                  //放置 Br物件 用來快速跳行
        //--------------------------------------------------------換行
        this.auto_changeline=true;    //自動換行
        this.line_space=6;            //行距
        //--------------------------------------------------------常用參數
        this.isFocus=false;           //只要被鎖定，就一直是 true
        this.mousePressing=false;     //只有自身被按下期間是 true
        this.index=0;
        this.selecting=[0,0];
        //------------------------------------------------特殊屬性
        this.enableChangeLine=true;      //允許自動換行
        //------------------------------------------------輸入模式
        this.input_funcs={};
        this.input_mode='text';
        let tblock=this;
        this.addInputMethod('text',(char)=>{return new Char(tblock,{'char':char,'fontHeight':'30'});}); 
        this.inp_color='black';     //輸入指標顏色
        //-------------------------------------------------------- Composing 文字
        this.isComposing=false;  //是否編譯中
        this.composingIndex=0;   //編譯開始前指針
        this.composingBox=[];    //編譯中箱子[[字,baseObj],...]
        //-------------------------------------------------------- 設定block
        this.setBlock(block);
    }
    setBlock(block){
        if(typeof block[0]=='number')
            this.block=new RectBlock(block);
        else this.block=new AnyBlock(block);
        this.arrange();
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
        let baseObj=this.input_funcs[this.input_mode](value);
        if(_mdict!=null) baseObj.updateDict(_mdict);
        return baseObj;
    }
    //=====================================================================================添加與管理物件
    insertObj(index,baseObj){
        this.index=index;
        this.addObj(baseObj,'rel');
    }
    addObj(baseObj,atype='rel'){
        if(atype=='rel'){
            this.relObjs.splice(this.index,0,baseObj);
            this.index++;
        }else this.absObjs.push(baseObj);
        //baseObj.setParent(this.tmodel);
    }
    addObjs(baseObjs,atype='rel'){
        if(!Array.isArray(baseObjs)) baseObjs=[baseObjs];
        for(let i=0;i<baseObjs.length;i++) this.addObj(baseObjs[i],atype);
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
    //=====================================================================================滑鼠事件(視為真實點按)
    onmousedown(relPos){
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
            return this.index;
        }
        return null;
    }
    onmousemove(relPos,event,show_deal=false){   //show_deal: 是否 顯示 對被選定的物件操作框
        if(this.block.inblock([relPos[0],relPos[1],0,0]) && this.mousePressing){
            if(this.isFocus){
                this.index=this.tap(relPos);this.selecting[1]=this.index;
                //console.log('選定:',this.selecting);
                this.render_selection();
                //if(show_deal && this.selecting[0]==this.selecting[1]){
                    //------------------顯示[輸入游標]並閃爍
                this.show_inp();
                //}
            }else if(this.tcontrol.nowtmodel==this.tmodel){
                //---------------------進行[表格邊框]選定
                if(show_deal){}
            }
        }
    }
    onmouseup(relPos,event){
        this.onmousemove(relPos,event,true);
        this.mousePressing=false;
    }
    //=====================================================================================鍵盤事件(視為真實點按)
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
        if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Backspace','Delete','Enter'].includes(event.code))
            this.show_inp();
    }
    input(event){
        let value=this.tcontrol.inp.value;               // inp 的全 value
        if((!event.isComposing && isASCII(value))){      //直接英文輸入
            let baseObj=this.InputConvert(value);  //字元轉 baseObj
            this.addObj(baseObj,'rel');
            this.tcontrol.inp.clear();
        }else if(event.isComposing){
            if(!this.isComposing){
                this.isComposing=true;
                this.composingIndex=this.index;
            }
            //--------------------------------目標: composingBox 與 value 一樣長
            let i=0;       //逐字比較
            while (i<value.length){
                if(this.composingBox.length<=i){     //若 value 超過 composingBox 的長度
                    let baseObj=this.InputConvert(value[i]);
                    this.composingBox.push([value[i],baseObj]);this.insertObj(this.composingIndex+i,baseObj);
                    i++;
                }else if(this.composingBox[i][0]!=value[i]){     //可能是 value中段被刪除 或 value中段被新增
                    if(value.length>this.composingBox.length){   //value中段被新增
                        let baseObj=this.InputConvert(value[i],{'border-bottom':'1px dashed #000'});
                        this.insertObj(this.composingIndex+i,baseObj);this.composingBox.splice(i,0,[value[i],baseObj]);
                        i++;
                    }else if(value.length<this.composingBox.length){
                        this.removeObj(this.composingBox[i][1]);this.composingBox.splice(i,1);
                        this.index=this.composingIndex+i;
                    }else{
                        this.removeObj(this.composingBox[i][1]);
                        let baseObj=this.InputConvert(value[i],{'border-bottom':'1px dashed #000'});
                        this.composingBox[i]=[value[i],baseObj];this.insertObj(this.composingIndex+i,baseObj);
                    }
                }else i++;
            }
            for(let u=0;u<this.composingBox.length;u++) this.composingBox[u][1].updateDict({'DU':'1'});
        }
        this.ashow_inp();
    }
    keyup(event){
        if (!event.isComposing && this.composingBox.length>0) { //event.code == 'Enter' || 
            for(let i=0;i<this.composingBox.length;i++)
                this.composingBox[i][1].updateDict({'DU':'0'});
            this.index=this.composingIndex+this.composingBox.length;
            this.composingBox=[];
            this.tcontrol.inp.clear();
            this.isComposing=false;
            this.tmodel.renderData();
            this.show_inp();
        }else if(this.composingBox.length==0)
            this.show_inp();
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
    setAttr(index=null,index2=null){

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
            //if (telement.type=='br'){
            //    continue;
            //}
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
    arrange(){              //重新定位 所有relObjs 的座標
        //let start = performance.now(); // 開始時間
        let pos=this.block.initPos;
        let p=0;let k=0;const n=this.relObjs.length;
        let lastBr=null;    //上一個br
        this.block.enableChangeLine=this.enableChangeLine;
        while (k<n){                
            let h=this.lineHeight;       //默認該行行高
            //取出一行，relObjs[p:k] , k==n 或 relObjs[k]為Br
            while (k<n){
                let baseObj=this.relObjs[k];
                if(baseObj.type=='br') break;
                h=Math.max(baseObj.size[1],h);
                k++;
            }
            if(lastBr!=null) lastBr.setPos([pos[0],pos[1]+h-this.tcontrol.inp.size[1]]);
            //開始排列
            for(let i=p;i<k;i++){     //這個範圍裡面不會有 Br
                let baseObj=this.relObjs[i];
                let rect=[pos[0],pos[1],baseObj.size[0],h];
                if(baseObj.type=='align')         //調整對齊
                    rect[0]=baseObj.getAlignX(pos,i);
                let voidPos=this.block.getVoidPos(rect,this.lineSpace);
                if(voidPos==null) voidPos=[rect[0],rect[1]];
                baseObj.setPos([voidPos[0],voidPos[1]+h-baseObj.size[1]]);  //向下對齊
                pos=[voidPos[0]+rect[2],voidPos[1]];   //更新下一個座標
            }
            if(k<n){       //代表 relObjs[k]為Br
                pos=this.block.getVoidPos([0,pos[1]+h+this.lineSpace]);  //新一行的起點
                lastBr=this.relObjs[k];
                lastBr.setPos(pos);
            }
            k++;     // k==n+1 或 relObjs[k]為Br的下一項
            p=k;
            if(k>=n && this.enableChangeLine){
                if(this.tmodel.size[1]<pos[1]+h) this.tmodel.setHeight(pos[1]+h);
            }
        }
        //console.log(`排列時間: ${(performance.now() - start).toFixed(3)}ms`);
        this.tmodel.renderData();
        //console.log('重新排列');
    }
    render(Rect){             // 將自身內容繪製在 tmodel 上
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
        let relPos=getRelPos(this.tcontrol,this.tmodel);
        let hideInp=false;
        if(this.relObjs.length==0 || (this.index==0 && this.relObjs[0].type=='br')){       //首位
            inp.setPos([relPos[0]+this.block.initPos[0]-2,relPos[1]+this.block.initPos[1]-2]);
            inp.setInputHeight(this.lineHeight);
        }else{
            //---------------------------依據上一個 char 設定 input 高度
            let hk=this.find_telement(this.input_mode,-1,this.index-1);
            if(-1<hk && hk<this.relObjs.length)
                inp.setInputHeight(this.relObjs[hk].size[1]);
            //---------------------------依據上一個元素設定位置
            let baseObj;
            if(this.index==0){
                baseObj=this.relObjs[0];
                inp.setPos([relPos[0]+baseObj.pos[0]-2,relPos[1]+baseObj.pos[1]+baseObj.size[1]-inp.size[1]]);
            }else{
                if(this.index>=this.relObjs.length) this.index=this.relObjs.length;
                baseObj=this.relObjs[this.index-1];
                if(baseObj.pos[0]>this.tmodel.size[0]) hideInp=true;
                inp.setPos([relPos[0]+baseObj.pos[0]+baseObj.size[0]-2*this.tmodel.pd,
                    relPos[1]+baseObj.pos[1]+baseObj.size[1]-inp.size[1]]);
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
    //=====================================================================================操作事件(基本)
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
        if(!this.enableChangeLine) return;
        if(index!=null) this.index=index;
        let br=new Br(this,{'lineHeight':this.lineHeight});
        let tblock=this;
        br.addEvent('destroy',()=>{
            ArrayRemove(tblock.brs,br);
        });
        this.addObj(br);
        //----------------------插入 brs
        let insertBr=false;
        let _bindex=this.getObjIndex(br);
        for(let i=0;i<this.brs.length;i++){
            let bindex=this.getObjIndex(this.brs[i]);
            if(bindex>_bindex){
                this.brs.splice(i,0,br);
                insertBr=true;
                break;
            }
        }
        if(!insertBr) this.brs.push(br);
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
        let copyTeString=teToString(this.relObjs.slice(range[0],range[1]));
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
        this.show_inp();
    }
    //=====================================================================================外接操作
    ToTeString(){
        return teToString(this.relObjs);
    }
    LoadTeString(teString){
        this.clear();
        this.inputTeString(teString);
    }
    //==================================================================輸入操作
    inputTElements(telements){
        this.addObjs(telements);this.arrange();
    }
    inputTeString(teString){
        let dbox=stringToTDict(teString);
        for(let i=0;i<dbox.length;i++){
            let bdict=dbox[i];
            let classObj=TElementRegistry[bdict['type']]
            if(classObj!=undefined){
                let baseObj=new classObj[0](this,bdict);
                this.addObj(baseObj);
            }else console.log(bdict['type']+'型別未在登記表中');            
        }
        this.arrange();
    }
    inputText(text='',arrange=true){
        for(let i=0;i<text.length;i++){
            if(text[i]=='\n') this.changeLine();
            else this.addObj(this.InputConvert(text[i]));
        }
        if(arrange) this.arrange();
    }
    insertImage(src,_style=null){
        _style=defaultStyle(_style,{'src':src,'maxWidth':this.block.getLineWidth()/2,'errorSrc':'image/image-not-found.png'});
        let imageObj=new Image(this,_style);
        let tblock=this;
        //imageObj.addEvent('onload',()=>{tblock.arrange();});
        this.addObj(imageObj,'rel');
    }
    setAlign(align,ratio='align'){  //ratio='align':根據align變動; 'auto':定位至當前位置
        let adict={'align':align,'ratio':ratio};
        if(ratio=='auto') adict['adjust']='1';
        let alignObj=new Align(this,adict);
        this.addObj(alignObj,'rel');
        this.arrange();
        //if(ratio=='auto'){alignObj.startAdjust();this.arrange();}
    }
}