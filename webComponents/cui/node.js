import {copyDict, defaultDict, fetchDict, keysInDict, parseStyleString } from "../tool.js";

//================================================================================================== 基底畫布
let initWSize=[window.innerWidth,window.innerHeight];
class MainCanvas{
    constructor(){
        //------------------------------------ 背板 canvas 元素
        const canvas=document.createElement('canvas');
        canvas.style=`position:absolute;left:0px;top:0px;width:${initWSize[0]}px;height:${initWSize[1]};`;
        document.body.appendChild(canvas);
        this.topNode=null;      //頂層節點
        this.nowFontId=null;
        this.fontArray=[];     // ['fontHeight,fontfamily,color,BIUS']
        //-------------------------------------------------------------- 繪圖工具
        this.canvas=canvas;
        this.ctx=canvas.getContext("2d");
        //-------------------------------------------------------------- 解析度
        this.devicePixelRatio=window.devicePixelRatio || 1;
        this.pd=this.devicePixelRatio;     //像素密度 Pixel density
        canvas.width=initWSize[0]*this.pd;
        canvas.height=initWSize[1]*this.pd;
    }
    //============================================================================================== 文字處理
    getFontId(fontHeight,fontFamily,BIUS){  //返回 fontId (代表 fontkey 的索引位置)
        let fontkey=fontHeight+'_'+fontFamily+'_'+BIUS;
        let fIndex=this.fontArray.indexOf(fontkey);
        if(fIndex>-1) return fIndex;
        this.fontArray.push(fontkey);
        return this.fontArray.length-1;
    }
    setFont(fontId){
        if(fontId!=this.nowFontId){
            let ft=this.fontArray[fontId].split('_');
            this.ctx.font=parseInt(ft[0])*this.pd+'px '+ft[1];
            this.nowFontId=fontId;
        }
    }
    //------------------------------------------------------------ charNode 快速設定尺寸
    refreshCharSize(textNode,textStyle){
        let fontFamily=textStyle['font-family']?textStyle['font-family']:'Times New Roma';
        let fontHeight=textStyle['font-size']?unitConversion(textStyle['font-size']):16;
        this.ctx.font=fontHeight+'px '+fontFamily;
        //-------------------\\
        let charNodes=textNode.nodes;
        for(let i=0;i<charNodes.length;i++)
            charNodes[i].size=[this.ctx.measureText(charNodes[i].char).width,fontHeight];
        this.fontId=null;
    }
    //============================================================================================== 繪製
    render(){
        if(this.topNode!=null) this.topNode.render();
    }
    drawRect(rect,color){
        console.log('在',rect,'處塗',color);
        this.ctx.fillStyle=color;
        let pd=this.pd;
        this.ctx.fillRect(rect[0]*pd,rect[1]*pd,rect[2]*pd,rect[3]*pd);
    }
    drawRoundedRect(rect,color,radius=null){
        ctx.save(); // 儲存當前狀態
        ctx.beginPath();
        // 繪製圓角矩形
        let x=rect[0];
        let y=rect[1];
        let width=rect[2];
        let height=rect[3];
        //------------------------------------
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        // 設定顏色
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.restore(); // 還原狀態
    }
    drawLine(pos1,pos2,color,lineWidth=2,lineDash=null){}
    drawImage(image,rect,dest=null){}
    drawText(text,pos,color){
        let pd=this.pd;
        this.ctx.fillStyle='black';
        this.ctx.fillText(text,pos[0]*pd,pos[1]*pd);
    }
}
export const mc=new MainCanvas();
//================================================================================================= html 工具
export function defaultStyle(style=null,default_style=null){
    return defaultDict(style,default_style);
}
let waitUpdateTime=0;
export function updateDisplay(){    //最多20毫秒呼叫一次
    let t=Date.now();
    if(t>waitUpdateTime){ //代表目前沒有 setTimeout 在等待
        setTimeout(()=>{
            console.log('開始進行渲染');
            mc.render();
        },20);
        waitUpdateTime=t+15;
    }
}
const regex = /^(\d+(\.\d+)?)\s*(px|cm|mm|in|pc|pt)$/i;
const unitsToPixels = {     // 換算比例
    px: 1,
    cm: 96 / 2.54,  // 1cm = 96/2.54 px
    mm: 96 / 25.4,  // 1mm = 96/25.4 px
    in: 96,         // 1in = 96 px
    pc: 16,         // 1pc = 16px (基於 1pc = 12pt 和 1pt = 1.33px)
    pt: 1.33        // 1pt ≈ 1.33px
};
export function unitConversion(unitString){
    if(unitString==undefined) return 0;
    const match = unitString.match(regex);   // match=[unitString,數字,(小數部分),單位]
    // 解析數值和單位
    const number = parseFloat(match[1]);
    const unit = match[3].toLowerCase();
    // 計算並返回對應的像素值
    if (unit in unitsToPixels) {
        return number * unitsToPixels[unit];
    } else {
        throw new Error("不支持的單位");
    }
}
// html 默認繼承屬性
let inheritAttributes=['color','font','font-family','font-size','font-style','font-variant','font-weight',
    'letter-spacing','line-height','visibility','cursor','direction','word-spacing','quotes'
];
//================================================================================================= 基礎節點
export class Node{         //極為基礎的節點:不可以有子元素，可設定 defaultPos、size
    constructor(parent=-1){
        if(parent!=-1) parent.appendChild(this);
        this.type=this.constructor.name;
        //---------------------------------------------------------------- 基本參數
        this.parent=parent;        //自身父元素        
        this.is_selected=false;    //現在是否被選擇
        //---------------------------------------------------------------- 排列相關(不計scale)
        this.defaultPos=[0,0];                  //相對於父元素(0,0)的座標
        this.size=[0,0];                        //自身在父元素觀點下的尺寸 
    }
    select(is_selected){
        this.is_selected=is_selected;
    }
    //============================================================================== 基礎定位
    setDefaultPos(defaultPos){     //由[父元素]設定[預設]座標，defaultPos是相對[父元素]的位置
        this.defaultPos=defaultPos;
    }
    setScreenRect(){               //由[父元素]啟動，自身依據 offsetParent及pos 計算自身顯示位置
        let offsetParent=this.parent;
        this.screenRect=[
            offsetParent.screenRect[0]+this.defaultPos[0]*offsetParent.scale[0],
            offsetParent.screenRect[1]+this.defaultPos[1]*offsetParent.scale[1],
            this.size[0],this.size[1]
        ];
    }
    //============================================================================== 渲染
    render(){}
}
export class TextNode extends Node{          //最基本文字，依賴父元素的文字style
    constructor(parent,text){
        super(parent);
        this.setText(text);
    }
    appendChild(textnode){
        this.nodes.push(textnode);
    }
    //------------------------------------------------設定文字及計算尺寸
    setText(text){
        this.text=text;
        this.nodes=[];
        for(let i=0;i<text.length;i++)
            new CharNode(this,text[i]);
    }
    refreshCharSize(textStyle){    //刷新自身內部文字尺寸
        mc.refreshCharSize(this,textStyle);
    }
}
class CharNode extends Node{                 //任意字元，TextNode中自動包含的內容
    constructor(textNode,char){
        super(textNode);
        this.offsetParent=textNode.parent;  //以 textNode 的父元素作為定位元素
        this.char=char;                     //自身文字
    }
    render(){
        mc.drawRect(this.screenRect,'lightblue');
        mc.drawText(this.char,[this.screenRect[0],this.screenRect[1]+this.screenRect[3]]);
    }
}
export class SpaceNode extends CharNode{     //空白字元，TextNode中自動包含的內容
    constructor(textNode,number){
        super(textNode,' ');
        this.number=number;   //摺疊了多少空白
    }
    render(){
        mc.drawRect(this.screenRect,'white');
    }
}
//================================================================================================= style節點
export class Char extends CharNode{      //高級文字節點，可設定 font、color、bgcolor、scale、BIUS...
    constructor(parent,char){
        super(parent,char);
    }
    render(){}
}


export class BasicNode extends Node{      //初代的 html 節點，沒有css，可以有子元素，默認排列方式為 auto
    constructor(parent=-1,_attrs=null){   //attrs={id:'xxx',name:'xxx','style':屬性,...} 
        super(parent);
        //==================================================================================== 基本參數
        this._attrs={};  // attrs 的 style為字串，與_style不同時更新
        this.nodes=[];           //所有子元素
        //--------------------------------- 其他參數
        this._refreshCharSize=false;          // 是否要更新子元素中，charNode的尺寸
        //==================================================================================== 排列樣式
        this.display='inline';               // 自身排版模式
        this.nowrap=false;                   // 是否禁止換行
        //======================================================================= 排版參數
        //--------------------------------- 依據 style 設定的[非自動變更]參數
        this.stylePos=[0,0];           // 子元素排列的起始位置，相對於自身(0,0)
        this.styleSize=[null,null];    // 額外限制尺寸(null 代表自動)
        //--------------------------------- 依據狀態[自動變更]參數
        this.defaultSize=[0,0];        //以默認排列方式下，自身大小
        //==================================================================================== 載入 attr
        this.setAttrs(_attrs);
    }
    //======================================================================================== 基礎屬性
    setAttrs(_attrs=null){
        if(_attrs==null) _attrs={};
        Object.assign(this._attrs,_attrs);
    }
    //======================================================================================== 父子依賴
    appendChild(node){
        if(this.nodes.includes(node))    //如果已包含，就移動到最後
            this.nodes=ArrayFilter(this.nodes,node);
        this.nodes.push(node);
        if(!this.refreshCharSize && node instanceof TextNode)  //如果是textNode，下次更新前就要先設定文字尺寸
            this.refreshCharSize=true;
        //this._arrange();    //子元素建立後，會自動呼叫自己 arrange
    }
    removeChild(node){
        ArrayRemove(this.nodes,node);
        this._arrange();
    }
    //======================================================================================== 排列
    getDocumentFlow(){    //取得自身所有可排列子元素
        let nodes=[];
        for(let i=0;i<this.nodes.length;i++){
            let node=nodes[i];
            if(node.isDocumentFlow) nodes.push.apply(nodes,node.getDocumentFlow());
            else nodes.push(node);
        }
        return nodes;
    }
    getMaxInnerSize(){    // 取得[自身能容許]的[最大]可放置[內部空間]
        let maxInnerSize=this.parent.getMaxInnerSize();
        if(this.isDocumentFlow) return maxInnerSize;
        if(this.styleSize[0]!=null) maxInnerSize[0]=this.styleSize[0];
        if(this.styleSize[1]!=null) maxInnerSize[1]=this.styleSize[1];
        return maxInnerSize;
    }
    _arrange(){  // 排列所有子元素 (默認排版方式)，若自身尺寸不變，直接呼叫 updateDisplay
        if(this.refreshCharSize){          //更新文字內容的尺寸
            let textStyle=this.getTextStyle();
            //for()
            mc.refreshCharSize(this);
            this.refreshCharSize=false;
        }
        let nodes=this.nodes;
        //WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW 調用常數
        blockArrange(this);
        //}
    }
    //===================================================================================== html讀取
    setInnerHTML(htmlCode){   //解析 html 內容
        function readTextNode(){   //讀取文字節點，直到碰到"<"(return true) 或 全部結束(return false)
            let nowSpace=null;
            while (k<n){
                let char=htmlCode[k];
                k++;
                if(char==' '){
                    if(nowSpace==null) nowSpace=new SpaceNode(nowParent,0);  //建立空白節點
                    nowSpace.number++;
                }else{
                    if(nowSpace!=null){   //處理空白節點
                        nowParent.appendChild(nowSpace);
                        nowSpace=null;
                    }
                    if(char=='<') return true;  //如果為 html標籤起始，就跳出
                    new CharNode(nowParent,char);  //在當前 parent 新增文字節點
                }
            }
            return false;  //代表全部讀取完畢
        }
        function existTag(tag){    //是否在某個前方節點存在某個 tag
            let parent=nowParent;
            while (parent.tag!=tag){
                parent=parent.parent;
                if(parent==topObj) //tag追蹤最多到自身後停止
                    return false;
            }
            return true;
        }
        const n=htmlCode.length;let k=0;
        let topObj=this;   //頂層物件
        let nowParent=this;
        nowParent.allowArrange=false;
        let ignore=' \r\n>';          //讀取 attr 前忽視
        let readAttrStop='='+ignore;  //讀取 attr 時，碰見就停止
        while (k<n){
            if(readTextNode()){
                //此時 k 為 "<" 的下一個文字(必定為 tag 或 /tag 開頭)
                let attrs={};
                let attr='tag';    //剛剛讀取到的屬性
                let attrSet=true;  //接下來是否要進行設定屬性
                while (k<n){
                    let c=htmlCode[k];
                    if(c=='=') attrSet=true;
                    else if(c=='>'){
                        if(attrs[attr]==undefined) attrs[attr]=null;  //若上一個屬性未被設置，直接設為null
                        k++;      //避免將 ">" 勿讀為下一個字元
                        break;
                    }
                    else if (!ignore.includes(c)){
                        let p=k;
                        if(attrSet){     //要設定屬性，將接下來讀取到的東西轉為字串
                            if('"\''.includes(c)){
                                k++;
                                while(k<n && htmlCode[k]!=c) k++;
                                attrs[attr]=htmlCode.substring(p+1,k);    //去除左右引號，此時 k 為字串尾部
                            }else{
                                while (k<n && !ignore.includes(htmlCode[k])) k++;
                                attrs[attr]=htmlCode.substring(p,k);    //此時 k 為 value 尾部+1
                                k--;
                            }
                            attrSet=false;
                        }else{       //讀取一項新屬性
                            if(attrs[attr]==undefined) attrs[attr]=null;  //若上一個屬性未被設置，直接設為null
                            while (k<n && !readAttrStop.includes(htmlCode[k])) k++;
                            attr=htmlCode.substring(p,k);    //此時 k 為 attr 尾部+1
                            k--;   //避免 k 等等又+1
                        }
                    }
                    k++;
                }
                if(attrs['tag']){   //代表該元素有內容
                    if(attrs['tag'][0]=='/'){   //若為 /tag
                        let tag=attrs[attr].slice(1);
                        //-----------------------------檢查 至topObj 為止 是否有匹配的元素
                        if(nowParent!=topObj && existTag(tag)){
                            //------向前匹配成功
                            while (nowParent.tag!=tag){  //將之前的物件排列並封閉
                                nowParent.allowArrange=true;  //解鎖 arrange
                                nowParent.arrange();
                                nowParent=nowParent.parent;
                            }
                            nowParent.allowArrange=true;  //解鎖 arrange
                            nowParent.arrange();
                            nowParent=nowParent.parent;
                        } //若無法向前匹配，則忽視該 /tag
                    }else{
                        let baseObj=BaseObj(nowParent,attrs);
                        baseObj.allowArrange=false;
                        nowParent=baseObj;
                    }
                }
            }
        }
        while (nowParent!=topObj){
            nowParent.allowArrange=true;
            nowParent.arrange();
            nowParent=nowParent.parent;
        }
        topObj.allowArrange=true;  //解鎖 arrange
        topObj.arrange();
    }
}

export class StyleNode extends Node{     // 可以有子元素，支援所有 style 屬性設定、繪製、繼承，支援事件
                                         // 不實現 arrange
    constructor(parent,_style){
        super(parent);
        //================================================================================== 基本參數
        //--------------------------------------------------------- 事件&節點
        this.events={};          //事件
        
        //--------------------------------------------------------- 各種style
        this._style={};                    //自身被設定的所有屬性
        this._nowStyle={};                 /*自身當前的所有實際屬性
                                            (含繼承父元素的屬性)*/
        if(parent==-1) this.textStyle={};  //繼承祖輩與自身的文字屬性
        else this.textStyle=copyDict(parent.textStyle);
        //================================================================================== 快速style參數
        this.isContainingBlock=false;        //是否為"定位參考元素"
        this.isPercent=false;                //是否包含要載入百分比的內容
        
        this.offsetParent=parent;            //自身定位參考元素
        //----------------------------------------------------------------------- 排版參數(皆不計scale)
        

        
        this.elementSize=[0,0];     // style+padding+border(不計scale)
        
        this.margin=[0,0,0,0];
        this.border=[0,0,0,0];
        this.padding=[0,0,0,0];

        this.limitRect=[0,0,null,null];  //最小寬度,最小高度,最大寬度,最大高度
        this.lineHeight=0;               //列高
        //---------------------------------------------------------------------- 額外縮放
        this.scale=[1,1];
        //================================================================================== 開始設置
        this.setStyle(this._style);
    }
    //============================================================================================== 設置 style
    setStyle(_style=null){     // 改變自身設定的style
        if(_style!=null){
            Object.assign(this._style,_style);
            //--------------------------------------------------- 轉換掉 inherit
            for(const [key, value] of Object.entries(_style)){
                if(value=='inherit') _style[key]=this.parent._nowStyle[key];
            }
            this._setNowStyle(_style);
        }
    }
    _setNowStyle(_nowStyle){    // 僅能由[自身.setStyle]或[自身._inheritStyle]呼叫，設定當前實際狀態
                                // _nowStyle 是需要<新增>或<改變>的 nowStyle
                            // _nowStyle 中的值不可以是 inherit
                            // 程式結束後無論修改什麼內容，都必定使自己重新排列一次
        Object.assign(this._nowStyle,_nowStyle);
        //================================================================================= 組態參數
        this.innerSize=null;      //設定當前無法排列
        //----------------------------------------------------- 是否為"被參考定位"元素<包含塊>
        this.isContainingBlock=['relative','absolute','fixed'].includes(this._nowStyle['position']) ||
            keysInDict(this._nowStyle,['transform','perspective','filter','contain','will-change']);
        //----------------------------------------------------- 更新子元素尺寸
        if(_nowStyle['font-family'] || _nowStyle['font-size']){
            mc.refreshCharSize();
        }
        //----------------------------------------------------- 列高
        if(_nowStyle['line-height']) this.lineHeight=unitConversion(_nowStyle['line-height']);
        //----------------------------------------------------- 限制寬高
        if(keysInDict(_nowStyle,['min-width','min-height','max-width','max-height'])){
            if(_nowStyle['min-width'])  this.limitRect[0]=unitConversion(_nowStyle['min-width']);
            if(_nowStyle['min-height']) this.limitRect[1]=unitConversion(_nowStyle['min-height']);
            if(_nowStyle['max-width'])  this.limitRect[2]=unitConversion(_nowStyle['max-width']);
            if(_nowStyle['max-height']) this.limitRect[3]=unitConversion(_nowStyle['max-height']);
            this._lockArrange=2;
        }
        //----------------------------------------------------- 尺寸是否變更?
        if(_nowStyle['padding']){
            this.padding=[0,0,0,0];   //上右下左
            this._lockArrange=2;
        }
        if(_nowStyle['border']){
            this.border = [0,0,0,0];
            this._lockArrange=2;
        }
        if(_nowStyle['margin']){
            this.margin = [0,0,0,0];   //上右下左
            this._lockArrange=2;
        }
        if(_nowStyle['width'] || _nowStyle['height']){  // 固定數值或 auto
            this._lockArrange=2;
        }
        //========================================================= 所有 _nowStyle 都設置完後，通知子元素自身的變更
        let nodes=this.nodes;
        for(let i=0;i<nodes.length;i++){
            if(nodes[i] instanceof StyleNode)
                nodes[i]._inheritStyle(_nowStyle);    //通知子元素自身 nowStyle 變化
        }
        //========================================================= 自身是否重新排列?
        if(this._lockArrange==2) this._arrange();
        else updateDisplay();
        //---------------------------
        if(this._lockArrange || _style['width'] || _style['height']){
            this.innerSize=[unitConversion(this._style['width']),unitConversion(this._style['height'])];
            this._setInnerSize([unitConversion(this._style['width']),unitConversion(this._style['height'])]);
            //console.log('變更rect:',this.elementSize);
            this.setScreenRect(false);  //只有自身尺寸改變
        }else updateDisplay();
    }
    _inheritStyle(_parentNowStyle){   //僅能由[父元素.setStyle]呼叫，自身檢測父元素的這些變更會影響自身甚麼
        let changeStyle={};   //代表自身有更動到的 nowstyle
        for(const [key, value] of Object.entries(_parentNowStyle)){
            let nowValue=this._style[key];
            if(nowValue=='inherit' || (nowValue==undefined && inheritAttributes.includes(key))){
                changeStyle[key]=value;
            }
        }
        this._setNowStyle(changeStyle);    //更改自身目前狀態
    }
    _setInnerSize(innerSize){  // 僅能由 this.setStyle 或 this.arrange 呼叫
        this.innerPos=[    //排列起始
            this.margin[3]+this.border[3]+this.padding[3],
            this.margin[0]+this.border[0]+this.padding[0],
        ];
        //重新計算自身所有大小
        this.innerSize=innerSize;
        this.elementSize=[              // setScreenRect時會用到
            this.innerSize[0]+this.padding[1]+this.padding[3]+this.border[1]+this.border[3],
            this.innerSize[1]+this.padding[0]+this.padding[2]+this.border[0]+this.border[2]
        ];
        this.size=[                     // 被父元素排列時會用到
            this.elementSize[0]+this.margin[1]+this.margin[3],
            this.elementSize[1]+this.margin[0]+this.margin[2]
        ];
        if(this.parent!=-1)
            this.parent.arrange();  //自身尺寸改變，通知父元素更新排列 與 自身 screenRect
    }
    //========================================================================================= 自身排列
    _arrange(){               //僅能由自身呼叫，重設arrange的限制並重新排列
        this._lockArrange=0;
        this.arrange();
    }
    arrange(){
        if(this._lockArrange>0){
            if(this._lockArrange==1) this._lockArrange=2;
            return;
        }
        //-----------------------------------開始實現排列算法
    }
    getMaxInnerSize(){   // 取得自身最大可排列寬度
        if([undefined,'auto'].includes(this._style['width'])){
            if(this.parent!=-1)
                return this.parent.getMaxInnerSize();
            else return mc.topNode.getMaxInnerSize();
        }
        return unitConversion(this._style['width']);
    }
    //=========================================================================== 螢幕定位 & 渲染
    setScreenRect(all=true){
        let offsetParent=this.offsetParent;
        let sRect=[
            offsetParent.screenRect[0]+(this.pos[0]+this.margin[3])*offsetParent.scale[0],
            offsetParent.screenRect[1]+(this.pos[1]+this.margin[0])*offsetParent.scale[1],
            this.elementSize[0],this.elementSize[1]
        ];
        this.screenRect=[
            sRect[0]+sRect[2]/2*(1-this.scale[0]),
            sRect[1]+sRect[3]/2*(1-this.scale[1]),
            sRect[2]*this.scale[0],
            sRect[3]*this.scale[1]
        ];
        if(all){
            for(let i=0;i<this.nodes.length;i++) this.nodes[i].setScreenRect();
        }
    }
    render(){   // 繪製自身
        let sRect=this.screenRect;  //確定要繪製的位置
        if(this._style['box-shadow']){}
        //mc.drawRect(rect,shadowColor,arcRadius);  //陰影
        //mc.drawRect(rect,shadowColor,arcRadius);  //border
        mc.drawRect(sRect,this._style['background-color']);  //區塊背景
        if(this._style['border-radius']){}
        //mc.drawImage(image,rect);                       //圖片
        //mc.drawText('字',pos);                          //文字
        for(let i=0;i<this.nodes.length;i++)
            this.nodes[i].render();
    }
    //=========================================================================== 事件
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
    }
    delEvent(eventname,id=null,callback=null,all=false){
        let events=this.events[eventname];
        let nevents=events;
        for(let i=0;i<events.length;i++){
            let event=events[i];
            if(event[0]==id && (callback==null || callback==event[1])){
                nevents=ArrayFilter(events,event);
                if(!all) break;
            }
        }
        this.events[eventname]=nevents;
    }
    setEvent(eventname,callback,id){
        this.delEvent(eventname,id,null,true);
        this.addEvent(eventname,callback,id);
    }
    //=========================================================================== 毀壞
    destroy(){}
}
