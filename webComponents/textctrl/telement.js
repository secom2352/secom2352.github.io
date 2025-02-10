import { copy_dict, defaultDict, html_img, inRect, round } from "../tool.js";
import { defaultStyle, getRelPos, Label } from "../ui/base.js";
import { DragObj } from "../ui/widget.js";

export function teToString(telements){    //將陣列中的telements屬性儲存
    let sp='^';   //特殊宣告符號
    let dot='.';
    //--------------------------------------------------------主鍵位，使用時不用加型態宣告描述
    let mainDict={};
    for(const [key, value] of Object.entries(TElementRegistry)){if(value[1]!=null) mainDict[key]=value[1];}
    //--------------------------------------------------------繼承參數
    let inherit_dict={};
    let idict;
    let nowtype=null;
    let mainkey=null;      //元素代表鍵，代表一個元素的存在
    //---------------------------------------------------------開始
    function convertValue(value){
        value+='';   //轉型為string
        if(value==sp) return sp+dot;        // value 為 sp 字符
        if(value.length==1) return value;  // value 只有單個字
        return sp+value.length+dot+value;  // value 為多個字
    }
    let sbox=[];
    for(let i=0;i<telements.length;i++){
        let tdict=telements[i].getDict();      //取得建構字典
        //---------------------------------- 若型別不同，則宣告當前型別轉換
        if(tdict['type']!=nowtype){       //宣告不同
            nowtype=tdict['type'];
            if(inherit_dict[nowtype]==undefined) inherit_dict[nowtype]={};
            idict=inherit_dict[nowtype];
            mainkey=mainDict[nowtype];
            sbox.push(sp+'type'+dot+convertValue(nowtype));
        }
        //---------------------------------- 只寫出 tdict 與繼承的 inherit_dict 不同的 key
        Object.keys(tdict).filter(key => idict[key] !== tdict[key]).forEach(key => {
            if(key!=mainkey && key!='type'){           //宣告不同
                let value=tdict[key];
                idict[key]=value;
                sbox.push(sp+key+dot+convertValue(value));
            }
        });
        if(mainkey==undefined) sbox.push(' ');    //代表至少有個這個元素
        else sbox.push(convertValue(tdict[mainkey]));         //直接添加
    }
    return sbox.join('');
}

export function stringToTDict(teString){
    let sp='^';   //特殊宣告符號，用在"屬性"開頭
    let dot='.';  //特殊宣告符號，用在"屬性"結尾 or "數字"開頭及結尾
    //-------------------------------------------------------------------類別 轉換 TElement 字典
    let mainDict={};
    for(const [key, value] of Object.entries(TElementRegistry)){if(value[1]!=null) mainDict[key]=value[1];}
    //--------------------------------------------------------繼承參數
    let inherit_dict={};
    let idict;
    let nowtype=null;
    let mainkey=null;      //元素代表鍵，代表一個元素的存在
    //---------------------------------------------------------開始
    function readValue(){        //結束後，k指向 value 最後一個字+1 ， true:代表這是value，false:代表這是 attr
        fetch=teString[k];
        k++;
        if(fetch==sp){
            let q=teString.indexOf(dot,k);
            if(k==q){
                k++;return true;      //value，為 sp 這個字符
            }
            fetch=teString.substring(k,q);
            k=q+1;
            if(isNaN(fetch)) return false;  //attr
            k+=parseInt(fetch);
            fetch=teString.substring(q+1,k);
            return true;   //value，多個字
        }
        return true;      //value，且只有一個字
    }
    let fetch;    //用來裝 attr 或 value
    let dbox=[];
    let k=0;const n=teString.length;
    while (k<n){
        let isValue=readValue();
        if(isValue){
            let bdict=copy_dict(idict);
            if(mainkey!=undefined) bdict[mainkey]=fetch;
            dbox.push(bdict);
        }
        else{     //------------------------設定屬性
            let attr=fetch;
            isValue=readValue();
            if(attr=='type'){    //切換型態
                nowtype=fetch;
                if(inherit_dict[nowtype]==undefined) inherit_dict[nowtype]={'type':nowtype};
                idict=inherit_dict[nowtype];
                mainkey=mainDict[nowtype];
            }else idict[attr]=fetch;
        }
    }
    return dbox;
}



export class TElement{
    constructor(tblock,bdict){
        //--------------------------------------------------- 相容於 Base
        this.pos=[0,0];
        this.size=[0,0];
        this.events={'destroy':[]};
        //--------------------------------------------------- 基本參數
        this.tmodel=tblock.tmodel;         //tmodel
        this.bdict=bdict;           //自身字典
        this.text='';               //自身被複製時的文字
        this.is_selected=false;     //是否被選取
        //---------------------------------------------------- 設定型態
        let teType=this.constructor.name.toLowerCase();
        this.bdict['type']=teType;
        this.type=teType;
    }
    //---------------------------------座標
    getrect(){
        return [this.pos[0],this.pos[1],this.size[0],this.size[1]];
    }
    setPos(pos){
        this.pos=pos;
    }
    setSize(size){
        this.size=size;
    }
    //---------------------------------事件
    trigger_event(eventname,event){
        let events=this.events[eventname];
        for(let i=0;i<events.length;i++)
            events[i][1](event);
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
        if(this.events[eventname].length==1){
            let base=this;
            switch(eventname){
                case 'onmousedown':
                    this._element.onmousedown=(event)=>{base.trigger_event('onmousedown',event);};break;
                case 'onmousemove':
                    this._element.onmousemove=(event)=>{base.trigger_event('onmousemove',event);};break;
                case 'onmouseup':
                    this._element.onmouseup=(event)=>{base.trigger_event('onmouseup',event);};break;
                case 'onclick':
                    this._element.onclick=(event)=>{base.trigger_event('onclick',event);};break;
            }
        }
    }
    //---------------------------------銷毀
    destroy(){
        this.trigger_event('destroy');
    }
    //-----------------------------------------------------------------------自身渲染畫布
    render(){}
    select(is_selected){
        this.is_selected=is_selected;
    }
    //-----------------------------------------------------------------------自身建構字典
    updateDict(_dict=null){
        if(_dict!=null) Object.assign(this.bdict,_dict);
    }
    getDict(){         //有些 telement 的 bdict 內容並非及時更新，可覆寫此函數
        return this.bdict;
    }
}

export class Char extends TElement{
    constructor(tblock,bdict=null){
        bdict=defaultDict(bdict,{'fontFamily':'Arial','color':'black','fontHeight':30});
        super(tblock,bdict);
        /*-------------------------------------------------------基本參數
        bdict['char']                //文字
              'fontFamily'           //字體
              'fontHeight'           //原文字高度
              'scale'                //文字依據原尺寸縮放
              'color'                //顏色
              'bgcolor'              //背景顏色
              'B'                    //粗體
              'I'                    //斜體
              'U'                    //下底線
        //-------------------------------------------------------塗寫畫布*/
        let c=this.bdict['char'];                   //文字
        let h=parseInt(this.bdict['fontHeight']);   //高度
        //-----------------塗寫參數
        let tmodel=this.tmodel;
        this.font=tmodel.getTextFont(h,this.bdict['fontFamily']);
        //-------------------------------測量原始文字
        this.textSize=[tmodel.getCharWidth(c,this.font)/tmodel.pd,h];
        this.size=[this.textSize[0],h];
        this.wdh=this.size[0]/this.size[1];       //   w/h  比值
        //--------------------------------------------------------文字參數
        //this.params=[1,1,0,];
        this.text=c;
        //this.bdict['type']='char';
        //this.type='char';
    }
    render(){
        let tmodel=this.tmodel;
        if(this.is_selected){                            //被選擇
            tmodel.drawRect(this.getrect(),"lightblue");
        }else if(this.bdict['bgcolor'])
            tmodel.drawRect(this.getrect(),this.bdict['bgcolor']);
        tmodel.setTextStyle(this.font,this.bdict['color']);
        let y=this.pos[1]+this.size[1]*3/4;
        tmodel.drawText(this.bdict['char'],[this.pos[0]+Math.max((this.size[0]-this.textSize[0])/2,0),y],this.size[0]);
        if(this.bdict['DU']==1){
            y+=this.size[1]/4;
            tmodel.drawLine([this.pos[0],y],[this.pos[0]+this.size[0],y],'black',1,[5,3]);
        }
    }
    updateDict(_dict=null){
        if(_dict!=null){
            Object.assign(this.bdict,_dict);
            for(const [key, value] of Object.entries(_dict)){
                switch(key){
                    //case 'scale':        //文字 寬高縮放
                    //    let scale=value.split(',');
                    //    this.charScale=[parseInt(scale[0]),parseInt(scale[1])];
                    //    transformChar=true;break;
                    //case 'fontSize':            //當 scale 為 1:1時，文字高度為 fontSize 個 px
                    //    this.fontSize=parseInt(value);transformChar=true;break;
                    //case 'fontFamily':style_fetch['font-family']=value;break;
                    //case 'color':style_fetch['color']=value;break;
                    //case 'bgcolor':style_fetch['background-color']=value;break;
                    //case 'B':
                    //    if(value=='1') style_fetch['font-weight']='bold';
                    //    else style_fetch['font-weight']='normal';
                    //    break;
                    //case 'I':
                    //    if(value=='1') style_fetch['font-style']='italic';
                    //    else style_fetch['font-style']='normal';
                    //    break;
                    //case 'U':
                    //    if(value=='1') style_fetch['text-decoration']='underline';
                    //    else style_fetch['text-decoration']='none';
                    //    break;
                    //case
                }
            }
        }
    }
}

export class Br extends TElement{
    constructor(tblock,bdict){
        bdict=defaultStyle(bdict,{'lineHeight':'30'});
        super(tblock,bdict);
        this.size=[0,parseInt(this.bdict['lineHeight'])];
        this.text='\n';
        //this.bdict['type']='br';
        //this.type='br';
    }
}

export class Image extends TElement{
    constructor(tblock,bdict=null){
        super(tblock,bdict);
        let image=this;
        //-------------------------------------基本參數
        this.newEvent('onload');
        this.onload=false;
        //-------------------------------------載入 img
        let img=new window.Image();
        img.src =this.bdict['src'];
        img.onload = function() {
            image.imageSize=[img.naturalWidth,img.naturalHeight];
            image.size=[img.naturalWidth,img.naturalHeight];
            if(image.bdict['maxWidth']){       //-------------------不超過最大寬度
                let width=parseInt(image.bdict['maxWidth']);
                if(image.imageSize[0]>width)
                    image.size=[width,width*image.imageSize[1]/image.imageSize[0]];
            }
            image.onload=true;
            tblock.arrange();
            image.trigger_event('onload');
        };
        img.onerror=function(){
            if(image.bdict['errorSrc']) img.src=image.bdict['errorSrc'];
        }
        this._img=img;
        //------------------------------------
        this.bdict['type']='image';
        this.type='image';
    }
    render(){
        if(this.onload){
            let rect=this.getrect();
            this.tmodel.drawImage(this._img,rect);
            if(this.is_selected){
                this.tmodel.drawRect(rect,'rgba(173, 216, 230,0.5)');
            }
        }
    }
    updateDict(_dict=null){
        if(_dict!=null){
            Object.assign(this.bdict,_dict);
        }
    }

}

export class Align extends TElement{
    constructor(tblock,bdict){
        super(tblock,bdict);
        if(this.bdict['ratio']=='align') 
            this.bdict['ratio']={'left':0,'center':0.5,'right':1}[this.bdict['align']];
        this.size=[0,tblock.lineHeight];
        //------------------------------基本參數
        this.tblock=tblock;
        this.alignN={'left':0,'center':0.5,'right':1}[this.bdict['align']];  //這與 ratio 不同，勿搞混
        this._adjust=false;        //是否[開啟]為調整中狀態
        //-------------------------------
        //this.bdict['type']='align';
        //this.type='align';
        this.beArranged=false;      //只有在被第一次排列後才可 adjust
    }
    getAlignX(pos,nowIndex=null){           //取得 若自身位在某 pos 下，自身應該對齊的位置(水平x)
        if(this.bdict['ratio']=='auto') return pos[0];     //代表當前尚未定位完成
        let info=this.getAlignInfo(pos,nowIndex);
        let block=this.tblock.block;
        let x=block.getLineStartX(pos)+block.getLineWidth(pos)*parseFloat(this.bdict['ratio']);
        return Math.max(pos[0],x-info[1]*this.alignN);
    }
    getAlignInfo(pos=null,nowIndex=null){         //取得 [前物件尾端x,自身包含物件寬度,結尾或下一個對齊起始x]
        if(pos==null) pos=this.pos;
        if(nowIndex==null) nowIndex=this.tblock.relObjs.indexOf(this);
        //-----------------------最左
        let l=this.tblock.block.getLineStartX();
        if(nowIndex>0){
            let preObj=this.tblock.relObjs[nowIndex-1];
            l=preObj.pos[0]+preObj.size[0];
        }
        //-----------------------中間物件長度
        let k=nowIndex+1;
        let relObjs=this.tblock.relObjs;
        let w=0;const n=relObjs.length;
        while (k<n && !['br','align'].includes(relObjs[k].type)){
            w+=relObjs[k].size[0];
            k++;
        }
        //------------------------最右
        let r=this.tblock.block.getLineEndX();
        if(k<n && relObjs[k].type!='br') r=relObjs[k].pos[0];
        return [l,w,r];
    }
    //--------------------------------------------------------------------------------------調整比例
    setPos(pos){
        super.setPos(pos);
        this.beArranged=true;     //第一次被排列
    }
    render(){                 //被排列後才能正確定位
        if(this.beArranged){
            if(!this._adjust && this.bdict['adjust']=='1') this.startAdjust();
            else if(this._adjust && this.align_dbj && !this.align_dbj.dragging){
                this.locateDbj();
            }
        }
    }
    startAdjust(){
        if(!this._adjust && this.beArranged){
            this.bdict['adjust']='1';
            this._adjust=true;
            //-----------------------------------------------------------------------開始布置
            let align_dbj=new DragObj(this.tmodel.tcontrol,null,[16,16],{'cursor':'ew-resize'});
            align_dbj.stopPropagation('onmousedown');
            let align_label=new Label(align_dbj,html_img('align-left',[20,20]),[2,0],[20,20],{'cursor':'ew-resize'});
            align_dbj.setlimit('hr',true);align_label.setAlign(null,'center');
            this.alabel=html_img('align-'+this.bdict['align'],[12,12]);
            //-------------------------------------------------------------設置拖動事件
            let _align=this;
            align_dbj.setEvent('drag-start',function(event){
                let info=_align.getAlignInfo(_align.pos);
                align_dbj.setDomain(_align.tmodel,[info[0]+(info[1]-align_dbj.size[0])*_align.alignN,-50,
                                                   info[2]-(info[1]-align_dbj.size[0])*(1-_align.alignN)-_align.tmodel.size[0],0]);
            });
            align_dbj.setEvent('drag',function(offset){
                let ratio=_align.getDbjRatio();
                _align.bdict['ratio']=ratio+'';
                align_label.setLabel(_align.alabel+'&ensp;'+round(ratio*100,1)+'%');
                _align.tblock.arrange();           //重新排列
            },'setAlign');
            //-----------------------------------------------
            this.align_label=align_label;    //用來顯示當前比例(%)
            this.align_dbj=align_dbj;        //當前的移動方塊
            this.locateDbj();
            this.bdict['ratio']=this.getDbjRatio();
        }
    }
    getDbjRatio(){       //依據 dbj 的 pos 換算ratio
        if(this._adjust){
            let relPos=getRelPos(this.tmodel,this.align_dbj);
            let x=relPos[0]+(this.align_dbj.size[0])*this.alignN;
            let block=this.tblock.block;
            let startX=block.getLineStartX(this.pos);
            let lineWidth=block.getLineWidth(this.pos);
            return round((x-startX)/lineWidth,4);
        }
    }
    locateDbj(){       //將 ratio 換算成 dbj 應該定位的位置
        if(this._adjust){
            let info=this.getAlignInfo();
            let apos=this.tmodel.getAbsPos();
            //--------------------------------尋找 dbj 的參照物件
            let referObj=this;
            let relObjs=this.tblock.relObjs;
            let nowIndex=relObjs.indexOf(this);
            if(nowIndex+1<relObjs.length && relObjs[nowIndex+1].type!='br') referObj=relObjs[nowIndex+1];
            this.align_dbj.setAbsPos([apos[0]+referObj.pos[0]+(info[1]-this.align_dbj.size[0])*this.alignN,
                                      apos[1]+referObj.pos[1]-12]);
            let ratio=this.getDbjRatio();
            this.align_label.setLabel(this.alabel+'&ensp;'+round(ratio*100,1)+'%');
        }
    }
    cancelAdjust(){
        if(this._adjust){
            this._adjust=false;
            this.align_dbj.destroy();
        }
    }
    destroy(){
        this.cancelAdjust();
    }
}

export var TElementRegistry={         //[類別名]對應 : [類別,主鍵] 或 [類別,null]
    'char':[Char,'char'],
    'br':[Br,null],
    'image':[Image,'src'],
    'align':[Align,'ratio']
};