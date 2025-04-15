import { ArrayEqual, ArrayFilter, ArrayRemove,moreThan, parseStyleString } from "../tool.js";
import { mc,updateDisplay,CharNode,SpaceNode,StyleNode, TextNode} from "./node.js";

//================================================================================================= html 元素基底
class Base extends StyleNode{  //可以有子元素，有自身的 arrange 事件 & setInnerHTML 方法
    constructor(parent=-1,attrs=null){ //attrs={id:'xxx',name:'xxx','style':屬性,...} 
        //================================================================================ 基本參數
        super(parent,attrs['style']?parseStyleString(attrs['style']):{}); //設置自身 style
        this.attrs=attrs==null?{}:attrs;  // attrs 的 style為字串，與_style不同時更新
        this.tag=attrs['tag']?attrs['tag']:'base';                        //自身標籤
    }
    //===================================================================================== 父子依賴
    appendChild(node){
        if(this.nodes.includes(node))    //如果已包含，就移動到最後
            this.nodes=ArrayFilter(this.nodes,node);
        this.nodes.push(node);
        if(!this.refreshCharSize && node instanceof TextNode)  //如果是textNode，下次更新前就要先設定文字尺寸
            this.refreshCharSize=true;
    }
    removeChild(node){
        ArrayRemove(this.nodes,node);
    }
    //============<很重要>========<很重要>=====<很重要>==================================== 樣式 & 顯示 & 渲染
    arrange(forced=false){  // 由子往父 => 排列所有子元素，若自身尺寸不變，直接呼叫 updateDisplay
        if(forced) this.lockArrange=false;  //如果強制排列，就解鎖
        if(!this.lockArrange) return;
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
class Body extends Base{
    constructor(){
        let size=[window.innerWidth,window.innerHeight];
        super(-1,{
            'tag':'body',
            'style':`display:block;background-color:gray;width:${size[0]}px;height:${size[1]}px;`
        });
        this.size=size;
        mc.topNode=this;
    }
    //---------------------------------------------------------------- 依據 body 性質修正 
    _setInnerSize(innerSize){
        this.innerSize=innerSize;
        this.elementSize=[
            this.innerSize[0]+this.padding[1]+this.padding[3]+this.border[1]+this.border[3],
            this.innerSize[1]+this.padding[0]+this.padding[2]+this.border[0]+this.border[2]
        ];
        this.setScreenRect(false);
        updateDisplay();
    }
    setScreenRect(all=true){
        let sRect=[
            this.pos[0]+this.margin[3],this.pos[1]+this.margin[0],
            this.elementSize[0],this.elementSize[1]
        ];
        this.screenRect=[
            sRect[0]+sRect[2]/2*(1-this.scale[0]),sRect[1]+sRect[3]/2*(1-this.scale[1]),
            sRect[2]*this.scale[0],sRect[3]*this.scale[1]
        ];
        if(all){
            for(let i=0;i<this.nodes.length;i++)
                this.nodes[i].setScreenRect();
        }
    }
}
//background-color:gray;
export var body=new Body();
//================================================================================================= 基礎 html 元素
export function BaseObj(parent,attrs){
    let _style=attrs['style'];
    switch (attrs['tag']){
        case 'div':
            attrs['style']='display:block;'+_style;break;
        case 'span':
            attrs['style']='display:inline;'+_style;break;
    }
    let baseObj=new Base(parent,attrs);
    console.log('創建BaseObj物件:',baseObj);
    return baseObj;  //默認回傳
}
//=================================================================================================== 各種排列放式
function blockArrange(){  //自身 style 為
    //if(this!=body && this.parent==-1) return;    //自身處在暫存記憶中，不排列
    if(!this.allowArrange) return;
    if(this.refreshCharSize){          //更新文字內容的尺寸
        mc.refreshCharSize(this);
        this.refreshCharSize=false;
    }
    let nodes=this.nodes;
    //WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW 調用常數
    //----------------------------------------------------------------------- 座標邊界參數
    let startX=this.innerPos[0];         //排列初始位置(X)
    let y=this.innerPos[1];              //排列初始高度(Y)
    let endX=startX+this.getMaxInnerSize();  //取得排列可用的最大空間
    //----------------------------------------------------------------------- 排版參數
    let forbidChangeLine=this._style['white-space']=='nowrap';  //禁止換行
    let isFisrtBr=true;
    //==========================================================運算參數
    let k=0;const n=this.nodes.length;
    let innerSize=[0,0];  //排列後，可排列物件(static 或 relative)的 占用尺寸
    //-----------------------------------------------單列參數
    console.log('開始排列');
    //=========================================================================== 總計算
    while (k<n){
        //-------------------------------------------------------單列計算
        let lineHeight=this.lineHeight;
        let p=k;    //--------k 為 單列起點
        let xpos=[startX];  //[第一物件的X,......,該列最後可排物件的X,無法排入物件的X(該列最右X)];
        let testX=startX;
        //--------------------特殊規則
        let blockbreak=false;    //block物件獨佔一列:這個 block物件處理完，下一個就break(換行)
        let ignoreSpace=true;    //空白忽略:只讀取夾在非block物件中的空白，其餘忽略
        while(k<n){
            if(blockbreak) break;
            let baseObj=nodes[k];
            if(baseObj.needArrange){
                if(baseObj.type=='align'){
                    testX=baseObj.getAlignX([testX,y],k);
                    xpos[xpos.length-1]=testX;
                }
                if(baseObj.type=='br' && (xpos.length>1 || isFisrtBr)) break;  //強制換行
                if(baseObj._style && baseObj._style['display']=='block'){      //強制換行
                    if(xpos.length>1) break;
                    blockbreak=true;
                    ignoreSpace=true;
                }else{
                    if(baseObj instanceof CharNode && '\n '.includes(baseObj.char)){
                        if(baseObj.char==' ' && !ignoreSpace){}
                    }else ignoreSpace=false;
                    if(baseObj instanceof CharNode && 
                            (baseObj.char=='\n' || (ignoreSpace && baseObj.char==' '))){
                        xpos.push(testX);       //空白座標不便，且忽視該空白
                        k++;
                        continue;
                    }else ignoreSpace=false;
                }
                testX+=baseObj.size[0];
                if(testX>endX){   //如果超出限制寬度
                    if(!forbidChangeLine){  //若沒有禁止換行
                        if(xpos.length>1) break;  //該物件需排在下一行
                        else{
                            console.log('超寬，強制排入');
                            testX=endX;      //設置為最大寬度
                        }
                    }
                }
                xpos.push(testX);  //將下一個 baseObj 該排在的 X 座標
                lineHeight=Math.max(baseObj.size[1],lineHeight);
            }else if(baseObj._style){
                if(baseObj._style['position']=='absolute'){}
                if(baseObj._style['position']=='fixed'){}
            }
            k++;
        }
        //-----------------------------------更新寬高
        innerSize[0]=Math.max(innerSize[0],xpos[xpos.length-1]-startX);
        innerSize[1]+=lineHeight;
        if(moreThan(y+lineHeight,this.limitRect[3])){
            console.log('高度無法塞入');
            return false;
        }
        //-----------------------------------開始設置
        if(isFisrtBr) isFisrtBr=false;
        for(let i=p;i<k;i++){
            let baseObj=nodes[i];
            //--------------------------------------------------------判斷這個位置有沒有問題
            baseObj.setPos([xpos[i-p],y+lineHeight-baseObj.size[1]]);  //向下對齊
        }
        //-----------------------------------更新座標
        y+=lineHeight;
        //if(k<n) height+=lineSpace;
    }
    //if(autoFitSize){
    //---------------------------------------------------------- 限縮 innerSize 範圍
    innerSize=[Math.max(this.limitRect[0],innerSize[0]),Math.max(this.limitRect[1],innerSize[1])];
    if(this.limitRect[2]!=null) innerSize[2]=Math.min(innerSize[2],this.limitRect[2]);
    if(this.limitRect[3]!=null) newblock[3]=Math.min(innerSize[3],this.limitRect[3]);
    if(this._style['width']!='auto') innerSize[0]=this.innerSize[0];    //預設寬高不更動
    if(this._style['height']!='auto') innerSize[1]=this.innerSize[1];   //預設寬高不更動
    //---------------------------------------------------------- 判斷是否更改實際大小
    if(!ArrayEqual(innerSize,this.innerSize)) this._setInnerSize(innerSize);  //自身尺寸改變，呼叫父元素
    else{
        this.setScreenRect();   //當這趟都排列結束，就設置 所有渲染座標
        updateDisplay();
    }
    //}
}
function flexArrange(){}