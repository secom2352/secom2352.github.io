import { ArrayFilter, ArrayRemove } from "../tool.js";

class Body{
    constructor(){
        this._element=document.createElement('canvas');
        
    }
    drawText(){}
    drawRect(){}
    drawLine(){}
}
var body=Body();
var screenRect=[0,0,window.innerWidth,window.innerHeight];
class Base{
    constructor(parent=-1,style=null){
        //============================================================================ 前置處理
        this.type=this.constructor.name; //自身型態
        //------------------------------------------------------------ 父層依賴
        if(parent==-1) parent=body;
        parent.appendChild(this);
        //------------------------------------------------------------ style
        if(style==null) style={};
        this.style=style;    //設定上的style
        this._style={'position':'static'};   //全部的style
        //============================================================================ 基本參數
        //------------------------------------------------------------ 父子依賴
        this.parent=parent;
        this.children=[];
        //------------------------------------------------------------ 外觀
        this.pos=[0,0];        //用於排列，相對於[父元素(0,0)]的座標
        this.size=[0,0];       //用於排列，該元素所佔空間(含margin)
        //---------------------- style相關
        this.stylePos=[0,0];   /*style 的 left&top，依據 position 類型變化
                                  position:
                                    fixed   => 相對於螢幕(0,0)
                                    absolute=> 相對於父元素(0,0)
                                    relative=> 相對於父元素排列該元素後，
                                                該元素應該待的位置
                                    static  => 該值視為(0,0)
                                 */
        this.styleSize=[0,0];  //style 的 width&height
        //---------------------- 螢幕顯示位置
        this.screenPos=[0,0];  //用於顯示，相對於螢幕左上角(0,0)的位置
        //------------------------------------------------------------ 事件
        this.events={};
        //------------------------------------------------------------ 載入style
        this.loadStyle();

    }
    //---------------------------------------------------------------------------- 父子依賴
    appendChild(child){
        this.children=ArrayFilter(this.children,child);
        this.children.push(child);
    }
    removeChild(child){
        ArrayRemove(this.children,child);
    }
    //---------------------------------------------------------------------------- 顯示與排列
    arrange(){}
    render(){
        //------------------------------------------------------------ 繪製自身

    }
    //---------------------------------------------------------------------------- 外觀
    loadStyle(){}
    setStyle(_style=null){

    }
    setPos(pos){
        
    }
    setSize(size){}
    //---------------------------------------------------------------------------- 事件
    
    
}