import {ArrayRemove, copyDict, HtmlElement, styleString, void_function,defaultDict, ArrayFilter, vrotate, NumberArray} from "../tool.js";


// 添加默認屬性
export function defaultStyle(style=null,default_style=null){
    return defaultDict(style,default_style);
}

//將座標數值變為css描述
export function vchange(v){
    let v2=[v[0],v[1]];
    if(typeof v[0]=="number") v2[0]+='px';
    if(typeof v[1]=="number") v2[1]+='px';
    return v2;
}
var base_id=0;
function getId(){
    base_id++;
    return base_id;
}
export class Base{                           //所有面板元素的基礎基底
    constructor(tag='div',parent=-1,pos=null,size=null,_style=null){
        if(pos==null) pos=['0px','0px'];
        pos=vchange(pos);
        if(size==null) size=['auto','auto'];
        size=vchange(size);
        this._style={'position':'absolute','left':pos[0],'top':pos[1],'width':size[0],'height':size[1]};
        //-----------------------------------------------------------------------
        let _element=document.createElement(tag);
        this._element=_element;
        //---------------------------------------父層依賴
        if(body==undefined) document.body.appendChild(_element);
        else{
            if(parent==-1) parent=body;
            parent.appendChild(this);
        }
        this.parent=parent;
        this.events={   //[[id,func],...]
            'onmousedown':[],'onmousemove':[],'onmouseup':[],'onclick':[],
            'show':[],'hide':[],'destroy':[],'resize':[]
        };
        this.id=getId(this);
        //---------------------------狀態屬性
        this.pos=[0,0];      //及時更新
        this.size=[0,0];     //及時更新
        this.scale=null;     //默認 縮放(以中心為中點)
        this._enable=true;
        this.showing=true;
        this.alpha=1;       //透明度
        this.setStyle(_style);
        this.anime=null;      //當前動畫
        //---------------------------hover
        this.hover_style=null;
        //---------------------------------------
        this.children=[];
        this.type='base';
        this.base='base';     //繼承基底
    }
    //----------------------------------------------------------------------------document element基本功能
    appendChild(child){
        this.children.push(child);
        this._element.appendChild(child._element);
        this.updateRect();
    }
    removeChild(child){
        ArrayRemove(this.children,child);
        this._element.removeChild(child._element);
    }
    addEventListener(eventname,callback){
        this._element.addEventListener(eventname,callback);
    }
    setInnerHTML(html){
        this._element.innerHTML=html;
        this.updateRect();
    }
    getInnerHTML(){
        return this._element.innerHTML;
    }
    //----------------------------------------------------------------------------外觀
    _updateAttr(){
        let c=this._element;
        this.pos=[c.offsetLeft,c.offsetTop];
        this.size=[c.offsetWidth,c.offsetHeight];
        if(this.scale!=null){        //----------------------位置修正
            this._element.style.left=this.pos[0]+this.size[0]*(this.scale[0]-1)/2+'px';
            this._element.style.top=this.pos[1]+this.size[1]*(this.scale[1]-1)/2+'px';
            //this.pos[0]+=this.size[0]*(1-this.scale[0])/2;
            //this.pos[1]+=this.size[1]*(1-this.scale[1])/2;
            this.size[0]*=this.scale[0];
            this.size[1]*=this.scale[1];
        }
    }
    updateRect(){    //更新狀態
        this.setStyle({'left':this._style['left'],'top':this._style['top'],
            'width':this._style['width'],'height':this._style['height']});
    }
    setStyle(_style=null,update_style=true){
        function change_percent(key){
            if(_style[key]){
                let v=_style[key];
                if(v.slice(-1)=='%'){
                    let p=parseInt(v.substring(0,v.length-1))/100;
                    if(key=='left') style[key]=parent.size[0]*p+'px';
                    if(key=='top') style[key]=parent.size[1]*p+'px';
                    if(key=='width') style[key]=parent.size[0]*p+'px';
                    if(key=='height') style[key]=parent.size[1]*p+'px';
                }
            }
        }
        let parent=this.parent;
        if(_style==null) _style={};
        if(update_style) Object.assign(this._style,_style);
        let style=copyDict(this._style);

        if(style['position']=='fixed'){
            let frame=this.getFrame();
            if(this.parent!=frame)
                this.setParent(frame);
            style['position']='absolute';
        }
        if(this.parent!=-1){
            for(let i=0;i<4;i++){
                let key=['left','top','width','height'][i];
                change_percent(key);
            }
        }
        
        //------------------------------------------顯示與隱藏
        if(_style['visibility']){
            if(_style['visibility']=='hidden') this.showing=false;
            else this.showing=true;
        }
        //------------------------------------------
        this._element.style=styleString(style);
        //-------------------------------------------更新常用屬性
        this._updateAttr();
        //--------------------------------------------子元素更新
        if(_style['width'] || _style['height']){
            for(let i=0;i<this.children.length;i++){
                let child=this.children[i];
                if(child.base=='base'){
                    if(child._style['left'].slice(-1)=='%' || child._style['top'].slice(-1)=='%' || 
                       child._style['width'].slice(-1)=='%' || child._style['height'].slice(-1)=='%')
                        child.updateRect();
                }
            }
            this.trigger_event('resize',this.size);
        }
        if(_style['opacity']) this.alpha=parseFloat(_style['opacity']);
    }
    setTemStyle(_style){
        this.setStyle(_style,false);
    }
    //------------------------------------------------------------------顯示隱藏
    show(pos=null){
        if(!this.showing || pos!=null){
            let _style={'visibility':'visible'};
            if(pos!=null){
                pos=vchange(pos);
                _style['left']=pos[0];_style['top']=pos[1];
            }
            this.setStyle(_style);
        }
        this.trigger_event('show');
    }
    hide(){
        if(this.showing) this.setStyle({'visibility':'hidden'});
        this.trigger_event('hide');
    }
    //------------------------------------------------------------------各種rect
    getrect(){
        return [this.pos[0],this.pos[1],this.size[0],this.size[1]];
    }
    getabsrect(){
        let abspos=this.getAbsPos();
        return [abspos[0],abspos[1],this.size[0],this.size[1]];
    }
    setrect([x,y,w,h],_style=null){
        if(typeof x=='number') x+='px';
        if(typeof y=='number') y+='px';
        if(typeof w=='number') w+='px';
        if(typeof h=='number') h+='px';
        let style={'left':x,'top':y,'width':w,'height':h};
        if(_style!=null) Object.assign(style,_style);
        this.setStyle(style);
    }
    //-----------------------------------------------------------座標
    getScreenPos(){        //取得相對於螢幕左上角的座標
        let rect=this._element.getBoundingClientRect();
        return [rect.left,rect.top];
    }
    getAbsPos(){           //取得絕對座標
        let pos=[this.pos[0],this.pos[1]];
        let parent=this.parent;
        while (parent!=-1){
            pos[0]+=parent.pos[0];
            pos[1]+=parent.pos[1];
            parent=parent.parent;
        }
        return pos;
    }
    setAbsPos(abspos){   //設定絕對座標
        let apos=this.parent.getAbsPos();
        this.setPos([abspos[0]-apos[0],abspos[1]-apos[1]]);
    }
    setAbsX(absx){
        let apos=this.parent.getAbsPos();this.setX(absx-apos[0]);
    }
    setAbsY(absy){
        let apos=this.parent.getAbsPos();this.setY(absy-apos[1]);
    }
    //-----------------------------------------------------------相對座標
    setX(x){
        if(typeof x=='number') x+='px';
        this.setStyle({'left':x});
    }
    setY(y){
        if(typeof y=='number') y+='px';
        this.setStyle({'top':y});
    }
    getCenter(){
        return [this.pos[0]+this.size[0]/2,this.pos[1]+this.size[1]/2];
    }
    setPos(pos){
        pos=vchange(pos);
        this.setStyle({'left':pos[0],'top':pos[1]});
    }
    move(offset){
        let pos=[this._element.offsetLeft+offset[0],this._element.offsetTop+offset[1]];
        this.setPos(pos);
    }
    setAlign(hr=null,vr=null){    //設定自身置於相對於父元素的位置
        let p=this.parent;
        let _style={};
        if(hr!=null) _style['left']=(p.size[0]-this.size[0])*{'left':0,'center':0.5,'right':1}[hr]+'px';
        if(vr!=null) _style['top']=(p.size[1]-this.size[1])*{'top':0,'center':0.5,'bottom':1}[vr]+'px';
        this.setStyle(_style);
    }
    //------------------------------------------------------------------尺寸
    setScale(scale){
        this.scale=scale;
        this.setStyle({'transform':`scale(${scale[0]},${scale[1]})`});
    }
    //-----------------------------------------------------------實際
    setWidth(width){
        if(typeof width=='number') width+='px';
        this.setStyle({'width':width});
    }
    setHeight(height){
        if(typeof height=='number') height+='px';
        this.setStyle({'height':height});
    }
    setSize(size,_style=null){
        size=vchange(size);
        let style={'width':size[0],'height':size[1]};
        if(_style!=null) Object.assign(style,_style);
        this.setStyle(style);
    }
    //-----------------------------------------------------------比率
    setWidthRate(wrate){
        if(this.scale==null) this.setSizeRate([wrate,1]);
        else this.setSizeRate([wrate,this.scale[1]]);
    }
    setHeightRate(wrate){
        if(this.scale==null) this.setSizeRate([wrate,1]);
        else this.setSizeRate([wrate,this.scale[1]]);
    }
    setSizeRate(srate){
        this.scale=srate;
        this.setStyle({'transform':`scale(${srate[0]},${srate[1]})`})
    }
    //------------------------------------------------------------------顏色
    setBg(color){
        this.setStyle({'background-color':color});
    }
    setColor(color){
        this.setStyle({'color':color});
    }
    setAlpha(alpha){   // alpha 介於 0~1
        this.setStyle({'opacity':alpha});
    }
    //------------------------------------------------------------------層
    setLayer(layer){
        this.setStyle({'z-index':layer});
    }
    getLayer(){
        if(this._style['z-index']) return this._style['z-index'];
        return 0;
    }
    //    this.setSize([this._element.offsetWidth,this._element.offsetHeight]);
    //}
    
    //fitContent(){       //用於相容innerHTML
    //    if(this.children.length>0){
    //        let size=[this._element.offsetWidth,this._element.offsetHeight];
    //        for(let i=0;i<this.children.length;i++){
    //            let rect=this.children[i].getrect();
    //            size[0]=Math.max(size[0],rect[0]+rect[2]);
    //            size[1]=Math.max(size[1],rect[1]+rect[3]);
    //        }
    //        let _style={};
    //        let w=this._style['width'];
    //        let h=this._style['height'];
    //        if(w[w.length-1]=='x') _style['width']=size[0]+'px';
    //        if(h[h.length-1]=='x') _style['height']=size[1]+'px';
    //        this.setStyle(_style);
    //    }
    //    if(this.parent!=-1 && this.parent.type!='frame') this.parent.fitContent();
    //} 
    //----------------------------------------------------------------------------父層依賴
    setParent(parent){
        this._disableHover();
        this.parent.removeChild(this);
        parent.appendChild(this);
        this.parent=parent;
        this._enableHover();
    }
    getFrame(){             //回傳其「頂層依賴」，type為Frame或parent為-1的物件
        if(this.parent==-1) return this;
        let parent=this.parent;
        while (parent.type!='frame' && parent.parent!=-1) parent=parent.parent;
        return parent;
    }
    getParents(){         //取得所有祖輩元素
        if(this.parent==-1) return [];
        let parents=this.parent.getParents();
        parents.push(this.parent);
        return parents;
    }
    //----------------------------------------------------------------------------事件
    trigger_event(eventname,event){
        let events=this.events[eventname];
        for(let i=0;i<events.length;i++)
            events[i][1](event);
    }
    newEvent(eventnameList,addEventListener=true){     //添加新事件集
        if(typeof eventnameList=="string") eventnameList=[eventnameList];
        let base=this;
        for(let i=0;i<eventnameList.length;i++){
            let eventname=eventnameList[i];
            if(addEventListener && this.events[eventname]==undefined){
                this._element.addEventListener(eventname,function (event){
                    base.trigger_event(eventname,event);
                });
            }
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
                case 'ondblclick':
                    this._element.ondblclick=(event)=>{base.trigger_event('ondblclick',event);};break;
            }
        }
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
    stopPropagation(eventname){
        this.addEvent(eventname,(event)=>{event.stopPropagation();});
    }
    enable(_enable=true){
        this._enable=_enable;
        this._element.disabled=!_enable;
    }
    //----------------------------------------------------------------------------hover
    _enableHover(){      // hover只在該frame中有效
        let base=this;
        let set_hoverstyle=false;
        let hovering=false;
        this.addEvent('onmousemove',(event)=>{
            if(base._enable){
                hovering=true;
                if(!set_hoverstyle){
                    if(base.hover_style!=null){
                        let hstyle=copyDict(base._style);
                        Object.assign(hstyle,base.hover_style);
                        base._element.style=styleString(hstyle);
                    }
                    if(base.hover_event!=undefined && base.hover_event!=null)
                        base.hover_event(event);
                    set_hoverstyle=true;
                }
            }
        },'myhover');
        if(this.hover_domain==null) this.hover_domain=this.getFrame();
        this.hover_domain.addEvent('onmousemove',(event)=>{
            if(hovering){
                hovering=false;
            }else if(set_hoverstyle){
                base.setStyle();
                set_hoverstyle=false;
            }
        },this.id+'_hoverDomain');
    }
    _disableHover(){
        this.delEvent('onmousemove','myhover');
        if(![null,undefined].includes(this.hover_domain))
            this.hover_domain.delEvent('onmousemove',this.id+'_hoverDomain');
        this.hover_domain=null;
    }
    setHover(_style=null,hover_event=null,hover_domain=null){
        this._disableHover();
        if(_style==null) _style={};
        this.hover_style=_style;
        this.hover_event=hover_event;
        this.hover_domain=hover_domain;
        this._enableHover();
    }
    //----------------------------------------------------------------------------右鍵選單
    bindContextMenu(contextmenu,name){
        let frame=this.getFrame();
        frame.addContextMenu(contextmenu);
        let base=this;
        this._element.addEventListener('contextmenu', function(event){
            if(base._enable)
                contextmenu.show(name,event);
        });
    }
    //----------------------------------------------------------------------------全螢幕
    FullScreen(){
        this._element.requestFullscreen();
    }
    //----------------------------------------------------------------------------動畫
    runAnime(anime_style,times,animeFunc=null){
        let anime=new Anime(AnimeFunc(this,anime_style,animeFunc),times);
        this.anime=anime;
        body.addAnime(anime);
        anime.start();
    }
    //----------------------------------------------------------------------------銷毀
    destroy(){
        //------------------------------刪除所有children
        //console.log('children:',this.children);
        while(this.children.length>0){
            this.children[0].destroy();
        }
        this.trigger_event('destroy');
        //-------------------------------清空自身事件
        for(let [eventname,callback] of Object.entries(this.events)){
            this.events[eventname]=[];
        }
        this.parent.removeChild(this);
    }
}
export class Canvas extends Base{
    constructor(parent=-1,pos=null,size=null,_style=null){
        super('canvas',parent,pos,size,_style);
        //--------------------------------------------------------------基本參數
        this.ctx=this._element.getContext("2d");
        this.autoSetCanvasSize=true;         //自動調整內部Canvas尺寸
        this.bgcolor=null;
        //--------------------------------------------快速格式
        this.nowFontkey=null;      //目前書寫文字的 fontkey
        this.ctxTransforming=false;   //自身 ctx 的屬性是否處於變換中
        //--------------------------------------------------------------精細度調整
        this.devicePixelRatio=window.devicePixelRatio || 1;
        this.pd=this.devicePixelRatio;     //像素密度 Pixel density
        const canvas=this;
        this.addEvent('resize',(size)=>{if(canvas.autoSetCanvasSize) canvas.setCanvasSize(size);});
        this.setCanvasSize(this.size);
    }
    setCanvasSize(size){
        this._element.width =size[0]* this.pd;
        this._element.height =size[1]* this.pd;
    }
    setPixelDensity(pd,changeCanvasSize=true){
        this.pd=pd;
        this.nowFontkey=null;
        if(changeCanvasSize) this.setCanvasSize(this.size);
    }
    newDraw(drawFunc){
        this.ctx.save();
        drawFunc();
        this.ctx.restore();
    }
    //-------------------------------------------------------------------------------------矩形
    clearRect(rect=null){         //實際 rect ，非畫布 rect
        if(rect==null) rect=[0,0,this.size[0],this.size[1]];
        let pd=this.pd;
        if(this.bgcolor!=null) this.drawRect(rect,this.bgcolor);
        else this.ctx.clearRect(rect[0]*pd,rect[1]*pd,rect[2]*pd,rect[3]*pd);
    }
    drawRect(rect,color=null){    //實際 rect ，非畫布 rect
        if(color!=null) this.ctx.fillStyle=color;
        let pd=this.pd;
        this.ctx.fillRect(rect[0]*pd,rect[1]*pd,rect[2]*pd,rect[3]*pd);
    }
    //-------------------------------------------------------------------------------------線條
    drawLine(pos1,pos2,color,lineWidth=2,lineDash=null){
        let ctx=this.ctx;
        let pd=this.pd;
        ctx.strokeStyle =color;
        ctx.lineWidth = lineWidth;
        if(lineDash!=null) ctx.setLineDash(lineDash); // 設定 [線段長度, 間距]
        else ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pos1[0]*pd,pos1[1]*pd);
        ctx.lineTo(pos2[0]*pd,pos2[1]*pd);
        ctx.stroke();
    }
    //-------------------------------------------------------------------------------------文字
    getCharWidth(char,fontkey){
        this.setFont(fontkey);
        return this.ctx.measureText(char).width;
    }
    getFontkey(fontHeight,fontFamily,bold='0'){  //返回 字體高度,fontFamily組合的 key
        if(bold=='0')
            return fontHeight+'_'+fontFamily;
        return fontHeight+'_'+fontFamily+'_B';
    }
    setFont(fontkey){
        if(fontkey!=this.nowFontkey){
            let ft=fontkey.split('_');
            if(ft.length==2)
                this.ctx.font=parseInt(ft[0])*this.pd+'px '+ft[1];
            else this.ctx.font='bold '+parseInt(ft[0])*this.pd+'px '+ft[1];
            this.nowFontkey=fontkey;
        }
    }
    setTextStyle(fontkey,color){
        this.setFont(fontkey);
        this.ctx.fillStyle=color;
    }
    drawText(text,pos,maxWidth=null){       //實際 pos、fontHeight，非畫布 pos、fontHeight
        let pd=this.pd;
        if(maxWidth!=null) this.ctx.fillText(text,pos[0]*pd,pos[1]*pd,maxWidth*pd);
        else this.ctx.fillText(text,pos[0]*pd,pos[1]*pd);
    }
    drawScaleText(text,pos,scale,maxWidth=null){       //實際 pos、fontHeight，非畫布 pos、fontHeight
        const canvas=this;
        this.newDraw(()=>{
            canvas.ctx.scale(scale[0],scale[1]);
            canvas.drawText(text,[pos[0]/scale[0],pos[1]/scale[1]],maxWidth/scale[0]);
        });
    }
    //-------------------------------------------------------------------------------------圖形
    drawImage(image,rect,dest=null){
        let pd=this.pd;
        if(dest==null)
            this.ctx.drawImage(image,rect[0]*pd,rect[1]*pd,rect[2]*pd,rect[3]*pd);
    }
    blit(canvas,pos){
    }
}

export class Panel extends Base{                              //空面板
    constructor(parent=-1,pos=null,size=null,_style=null){
        _style=defaultStyle(_style,{'padding':'0px'});
        super('div',parent,pos,size,_style);
        //--------------------------------事件
        let panel=this;
        this.newEvent(['onclick','ondblclick','contextmenu',
                       'paste','keydown','input','keyup',
                       'scroll']);
     //   this.scrolling=[false,false];   //水平,垂直
        this.addEvent('scroll',(event)=>{             //scroll冒泡
            if(panel.parent!=-1) panel.parent.trigger_event('scroll',event);
        });
        this.type='panel';
    }
    //------------------------------------------外觀
    loadHTML(html){
        this._element.innerHTML=html;
    }
    fill(bgcolor){
        this.setStyle({'background-color':bgcolor});
    }
}
export function voidPanel(size){
    return new Panel(-1,null,size);
}
export class Frame extends Panel{
    constructor(parent=-1,pos=null,size=null,_style=null){
        super(parent,pos,size,_style);
        //-----------------------------------
        let frame=this;
        this.contextmenus=[];           //當自身被點擊時，關閉此列表內contextmenu
        this.addEvent('onmousedown',function (event){frame.closeContextMenus();});
        //this.addEvent('onmousedown',function (event){frame.closeContextMenus();});
        //------------------------------------
        this.type='frame';
    }
    addContextMenu(contextmenu){
        if(!this.contextmenus.includes(contextmenu)) this.contextmenus.push(contextmenu);
    }
    removeContextMenu(contextmenu){
        this.contextmenus=ArrayFilter(this.contextmenus,contextmenu);
    }
    closeContextMenus(){
        for(let i=0;i<this.contextmenus.length;i++) this.contextmenus[i].hide();
    }
}
class Body extends Frame{
    constructor(){
        super(-1,[0,0],['100%','100%'],{'background-color':'#cccccc','overflow':'auto'});
        this.width=this._element.offsetWidth;
        this.height=this._element.offsetHeight;
        window.addEventListener("resize", () => {
            body.setSize([window.innerWidth,window.innerHeight]);
            body.trigger_event('resize',[window.innerWidth,window.innerHeight]);
        });
        this.animes=[];
        this.animating=false;
    }
    
    //------------------------------------------------------動畫
    addAnime(anime){
        this.animes.push(anime);
    }
    runAnime(){
        if(!this.animating){
            function animating(){
                let end=true;
                let k=0;
                while (k<animes.length){
                    animes[k].run();
                    if(animes[k].status!='end'){
                        end=false;
                        k++;
                    }else animes.splice(k,1);
                }
                for(let i=0;i<animes.length;i++){
                    animes[i].run();
                    if(animes[i].status!='end') end=false;
                }
                if(!end) setTimeout(animating,30);
                else body.animating=false;
            }
            this.animating=true;
            let animes=this.animes;
            setTimeout(animating,30);
        }
    }
}
export var body=new Body();

export class Label extends Base{
    constructor(parent,label,pos,size=null,_style=null){
        _style=defaultStyle(_style,{'cursor':'text','white-space':'nowrap'});
        super('label',parent,pos,size,_style);
        this.setLabel(label);
        this.type='label';
    }
    setLabel(label){
        this.label=label;
        this._element.innerHTML=label;
        this._updateAttr();
        //this.fitContent();
    }
}
export class DefaultButton extends Base{
    constructor(parent,label,onclick=null,pos,size=null,_style=null){
        _style=defaultStyle(_style,{'cursor':'pointer','white-space':'nowrap'});
        super('button',parent,pos,size,_style);
        this.setLabel(label);
        let btn=this;
        this.onclick=onclick;
        if(onclick!=null){
            this.addEvent('onclick',(event)=>{
                btn.onclick(event);
            },'buttonOnclick');
        }
        this.type='defaultbutton';
    }
    setLabel(label){
        this.label=label;
        this._element.innerHTML=label;
        this._updateAttr();
        //this.fitContent();
    }
}

export class Button extends DefaultButton{
    constructor(parent,label,onclick=null,pos=null,size=null,_style=null){
        _style=defaultStyle(_style,{'outline':'none','border':'0px','padding':'0px','background-color':'transparent'});
        super(parent,label,onclick,pos,size,_style);
        this.setHover({'background-color':'#00000060'});
        this.type='button';
    }
}
export class SwitchButton extends Button{
    constructor(parent,label,onEvent,offEvent,switch_style=null,pos=null,size=null,_style=null){
        function switch_click(event){
            sb.switch=!sb.switch;
            sb.setSwitch(sb.switch,event);
        }
        super(parent,label,switch_click,pos,size,_style);
        this.orig_style=copyDict(this._style);
        this.switch=false;
        this._switch_func=function(event){
            if(sb.switch) onEvent(event);
            else offEvent(event);
        }
        let sb=this;
        this.switch_style=switch_style;
        this.setHover(switch_style);
        this.type='switchbutton';
    }
    setSwitch(_switch,event=null){
        this.switch=_switch;
        if(this.switch) this.setStyle(this.switch_style);
        else{
            this.setStyle(this.orig_style);
        }
        if(event!=null) {           //代表這是點擊事件
            this.setTemStyle(this.switch_style);this._switch_func(event);
        }
    }
}
export class DropdownButton extends SwitchButton{
    constructor(parent,label,dropdown_style=null,pos=null,size=null,_style=null){
        super(parent,label,
            function(e){menu.show_below('main',ddbtn);},function(e){menu.hide();},
            dropdown_style,pos,size,_style);
        this.stopPropagation('onmousedown')  //封鎖Frame的自動關閉選單
        let ddbtn=this;
        let menu=new ContextMenu(this);
        menu.addEvent('hide',function(layer){ddbtn.setSwitch(false);});
        this._menu=menu;
        this.type='dropdownbutton';
    }
    setParent(parent){
        super.setParent(parent);
        this._menu.setParent(parent);
    }
    setMainMenu(paramsList,_style=null){
        this._menu.addMenu(0,'main',paramsList,_style);
    }
    addMenu(layer,menu_name,paramsList,_style=null){
        this._menu.addMenu(layer,menu_name,paramsList,_style);
    }

}

export class ColorButton extends Button{
    constructor(parent,label,choose_event,pos,size=null,_style=null){
        let color_input=HtmlElement('input',"visibility:hidden;position:absolute;");
        color_input.type='color';
        color_input.addEventListener('input',(event)=>{
            choose_event(color_input.value);
        });
        super(parent,label,function (event){
            color_input.style.left='0px';
            color_input.style.top=(cb.offsetHeight-color_input.offsetHeight)+'px';
            color_input.click();
        },pos,size,_style);
        let cb=this._element;
        this.setHover({'background-color':'beige'});
        this._element.appendChild(color_input);
        this.type='colorbutton';
    }
}

export class Select extends Base{
    constructor(parent,value_list,choose_event,pos,size=null,_style=null){
        super('select',parent,pos,size,_style);
        for (let i=0;i<value_list.length;i++){
            let value=value_list[i];
            let option=HtmlElement('option','',value);
            option.value=value;
            this._element.appendChild(option);
        }
        let select=this;
        this.newEvent('input');
        this.addEventListener('input', (event)=>{
            choose_event(select._element.value);
        });
        this.type='select';
    }
    setValue(value){
        this._element.value=value;
    }
}

export class Input extends Base{
    constructor(parent,input_event=null,pos=null,size=null,_style=null){
        super('input',parent,pos,size,_style);
        this.newEvent(['paste','input','keydown','keyup']);          //新增 input 事件
        //------------------------------------------------
        this.value='';
        this.input_event=input_event;
        //------------------------------------
        let inp=this;
        this.addEvent('input',function(event){
            inp.value=inp._element.value;   //及時更新
            inp.updateRect();
            if(inp.input_event!=null) inp.input_event(event);
        });
    }
    setValue(value){
        this._element.value=value;
        //this.trigger_event('input');
    }
    focus(){
        //this.parent._element.removeChild(this._element);
        this.parent._element.appendChild(this._element);
        this._element.focus();
    }
}
export class TextInput extends Input{
    constructor(parent,input_event=null,pos=null,size=null,_style=null){
        _style=defaultStyle(_style,{'border-color':'#666','border':'1px solid #ccc'});
        super(parent,function (event){
            inp.isComposing=event.isComposing;
            input_event(event);
        },pos,size,_style);
        this.addEvent('keydown',(event)=>{
            inp.shiftKey=event.shiftKey;
            inp.ctrlKey=event.ctrlKey;
        });
        this.addEvent('keyup',(event)=>{
            inp.shiftKey=false;
            inp.ctrlKey=false;
        });
        //---------------------------------------------------基本輸入參數
        let inp=this;
        this.isComposing=false;
        this.shiftKey=false;
        this.ctrlKey=false;
    }
    setInputHeight(height){
        let ed={'font-size':parseInt(height*3/4)+'px'};
        //if(this.size[1]<height)
        ed['height']=parseInt(height)+'px';
        this.setStyle(ed);
    }
    setInputColor(color){
        this.setStyle({'caret-color':color});
    }
    clear(){
        this._element.value='';
        this.value='';
    }
}

export class ScrollInput extends Input{
    constructor(parent,minV=0,maxV=100,step=1,input_event=null,pos=null,size=null,_style=null){
        super(parent,input_event,pos,size,_style);
        this._element.type='range';
        this._element.min=minV;
        this._element.max=maxV;
        this._element.step=step;
    }
}

export class BaseMatrix extends Base{
    constructor(parent=null,tag='div',baseObj=null,pos=null,size=null,_style=null){
        if(baseObj==null) baseObj=new Base('div',-1);
        if(parent==null) parent=baseObj.parent;
        if(size==null) size=baseObj.size;
        //_style=defaultStyle(_style,{'overflow':'hidden'});
        super(tag,parent,pos,size,_style);
        baseObj.setParent(this);
        this.element=baseObj;
        //-------------------------------運算參數
        this.scale=[1,1,1];     //縮放 w,h,d
        this.rotate=[0,0,0];    //旋轉 x,y,z
        this.offsetPos=[0,0];   //在運算[旋轉、縮放]計算後，對element進行位移
        this.padding=[0,0,0,0];
        this.type=='basematrix';
    }
    setInnerHTML(html){
        this.element.setInnerHTML(html);
        this._transform();
    }
    getInnerHTML(){
        return this.element.getInnerHTML();
    }
    //----------------------------------------------------------------------------外觀
    _transform(){
        this.element.setStyle({
            'transform':`scale3d(${this.scale[0]},${this.scale[1]},${this.scale[2]})
            rotateX(${this.rotate[0]}deg) rotateY(${this.rotate[1]}deg) rotateZ(${this.rotate[2]}deg)`
        });
        //----------------------------------------開始計算
        let inner_obj=this.element;
        let r=this.rotate[2]*-Math.PI/180;
        let pos1=[-inner_obj.size[0]/2,inner_obj.size[1]/2];
        let pos2=[-inner_obj.size[0]/2,-inner_obj.size[1]/2];
        let rpos1=vrotate(pos1,r);
        let rpos2=vrotate(pos2,r);
        let size=[Math.max(Math.abs(rpos1[0]),Math.abs(rpos2[0]))*2,Math.max(Math.abs(rpos1[1]),Math.abs(rpos2[1]))*2];
        inner_obj.setPos([(size[0]*this.scale[0]-inner_obj.size[0])/2+this.offsetPos[0],
                          (size[1]*this.scale[1]-inner_obj.size[1])/2+this.offsetPos[1]]);
        this.setSize([size[0]*this.scale[0],size[1]*this.scale[1]]);
    }
    //------------------------------------------------------------------旋轉
    setRotate2D(angle){
        this.setRotateZ(angle);
    }
    setRotate(xr=null,yr=null,zr=null){
        if(xr!=null) this.rotate[0]=xr;
        if(yr!=null) this.rotate[1]=yr;
        if(zr!=null) this.rotate[2]=zr;
        this._transform();
    }
    setRotateX(xr){
        this.setRotate(xr);
    }
    setRotateY(yr){
        this.setRotate(null,yr);
    }
    setRotateZ(zr){
        this.setRotate(null,null,zr);
    }
    //------------------------------------------------------------------縮放
    setScale(wr=null,hr=null,dr=null){
        if(wr!=null) this.scale[0]=wr;
        if(hr!=null) this.scale[1]=hr;
        if(dr!=null) this.scale[2]=dr;
        this._transform();
    }
    setScaleW(wr){
        this.setScale(wr);
    }
    setScaleH(hr){
        this.setScale(null,hr);
    }
    setScaleD(dr){
        this.setScale(null,null,dr);
    }
    //------------------------------------------------------------------額外偏移
    setOffsetPos(offsetPos){
        this.offsetPos=offsetPos;
    }
    //------------------------------------------------------------------padding
    setPadding(x,y){}
}
export class Hr extends Base{
    constructor(parent,pos=null,size=null,_style=null){
        if(size==null) size=['100%',1];
        super('hr',parent,pos,size,_style);
    }
}
export class MenuPanel extends Panel{            // ContextMenu 裡面的 Menu
    constructor(contextMenu,layer,_style){
        _style=defaultStyle(_style,{'box-shadow':'2px 2px 12px rgba(0, 0, 0, 0.2)','z-index':'1'});
        super(contextMenu.parent,null,null,_style);
        this.stopPropagation('onmousedown');
        //-----------------------------------基本參數
        this.contextMenu=contextMenu;
        this.layer=layer;
        this.items=[];         //物件按此順序，由上而下展示
    }
    addItem(params,arrange=true){
        this.insertItem(this.items.length,params,arrange);
    }
    addItems(paramsList){
        for(let i=0;i<paramsList.length;i++) this.addItem(paramsList[i],false);
        this.arrange();
    }
    insertItem(index,params,arrange=true){
        //params=[項目名,點擊事件callback，若為string，視為啟動下一層contextmenu的名稱,_style,hover_style]
        let Menu=this;let cm=this.contextMenu;let layer=this.layer;
        let li;
        if(params=='hr') li=new Hr(this);
        else if(params.length>=2){
            //------------------------------------補齊參數
            if(params[2]==undefined) params.push(null);
            if(params[3]==undefined) params.push({'background-color':'#e0e0e0'});
            let btn_style=defaultStyle(params[2],{'border':'0px','outline':'none',
                'background-color':'white','padding':'10px 20px','font-size':'16px','text-align':'left'});
            //-------------------------------------
            let onclick=void_function;
            if(typeof params[1]!="string") onclick=params[1];
            li=new Button(this,params[0],function(event){onclick(event);cm.hide();},null,null,btn_style);
            li.setHover(params[3],function (event){
                cm.hide(layer+1);
                if(typeof params[1]=="string"){
                  let Menu2=cm.menus[layer+1][params[1]];
                  let rect=Menu.getrect();let rect2=Menu2.getrect();
                  let pos=[rect[0]+rect[2]+3,rect[1]+li.pos[1]];
                  Menu2.show([Math.min(pos[0],window.innerWidth-rect2[2]),Math.min(pos[1],window.innerHeight-rect2[3])]);
                }
            },Menu);
        }
        if(index>=this.items.length) this.items.push(li);
        else this.items.splice(index,0,li);
        if(arrange) this.arrange();
    }
    arrange(){
        let size=[0,0];
        for(let i=0;i<this.items.length;i++){
            let li=this.items[i];li.setPos([0,size[1]]);
            size[0]=Math.max(size[0],li.size[0]);
            size[1]+=li.size[1];
        }
        this.setSize(size);
        for(let i=0;i<this.items.length;i++) this.items[i].setWidth(size[0]);
    }
}

export class ContextMenu{
    constructor(parent=-1){
        this.parent=parent;
        let frame;
        if(parent==-1) {frame=body;this.parent=body;}
        else if(parent.type=='frame') frame=parent;
        else frame=parent.getFrame();
        frame.addContextMenu(this);
        this.frame=frame;
        //-------------------------------------------------------
        this.menus=[{},{},{}];   //菜單列(預設3欄)
        this.showing=false;      //當前顯示狀態
        this.events={'show':[],'hide':[]};
    }
    //--------------------------------------------------------外觀
    setStyle(_style){
        for(let i=0;i<this.menus.length;i++){
            for(let [name, Menu] of Object.entries(this.menus[i])){
              Menu.setStyle(_style);
            }
        }
    }
    setLayer(layer){
        this.setStyle({'z-index':layer});
    }
    //----------------------------------------------------------------Menu物件
    getMenu(layer,menu_name){
        return this.menus[layer][menu_name];
    }

    addMenu(layer,menu_name,paramsList,_style=null){
        let Menu=new MenuPanel(this,layer,_style);
        Menu.addItems(paramsList);
        this.menus[layer][menu_name]=Menu;
        Menu.hide();
    }
    //-----------------------------------------------------父層依賴
    setParent(parent){
        this.parent=parent;
        for(let i=0;i<this.menus.length;i++){
            for(let [name, Menu] of Object.entries(this.menus[i])){
              Menu.setParent(parent);
            }
        }
        //--------------------
        this.frame.removeContextMenu(this);
        let frame;
        if(parent==-1) {frame=body;this.parent=body;}
        else if(parent.type=='frame') frame=parent;
        else frame=parent.getFrame();
        frame.addContextMenu(this);
        this.frame=frame;
    }
    //-----------------------------------------------------事件
    enable(layer,menu_name,btn_name,_enable=true){
        let Menu=this.menus[layer][menu_name];
        for(let i=0;i<Menu.children.length;i++){
            let btn=Menu.children[i];
            if(btn.label==btn_name) btn.enable(_enable);
        }
    }
    addEvent(eventname,callback){
        this.events[eventname].push(callback);
    }
    delEvent(eventname,callback){
        if(this.events[eventname].includes(callback))
            this.events[eventname] = this.events[eventname].filter(item => item !== callback);
    }
    //--------------------------------------------------------
    show(name,event){
        event.preventDefault();
        this.hide();
        let screenPos=[event.pageX+3,event.pageY+3];
        this.show_at(name,screenPos,event);
    }
    show_below(name,obj,hr_offset=null,event=null){
        let rect=obj.getabsrect();
        let pos=[rect[0],rect[1]+rect[3]];
        if(typeof hr_offset=='number') pos[0]+=hr_offset;
        else if(hr_offset!=null){
            let Menu=this.menus[0][name];
            if(hr_offset=='center') pos[0]+=(rect[2]-Menu.size[0])/2
        }
        if(event!=null) event.preventDefault();
        this.show_at(name,pos);
    }
    show_above(name,obj,hr_offset=null,event=null){
        let rect=obj.getabsrect();
        let Menu=this.menus[0][name];
        let pos=[rect[0],rect[1]-Menu.size[1]];
        if(typeof hr_offset=='number') pos[0]+=hr_offset;
        else if(hr_offset!=null){
            if(hr_offset=='center') pos[0]+=(rect[2]-Menu.size[0])/2
        }
        if(event!=null) event.preventDefault();
        this.show_at(name,pos);
    }
    show_at(name,screenPos,event=null){
        let Menu=this.menus[0][name];
        let mScreenPos=Menu.getScreenPos();
        //------------------------------------ 關閉其他Menu
        let frame=Menu.getFrame();
        frame.closeContextMenus();
        //------------------------------------ 如果 Menu 位置太低，就往上移動
        if(event!=null){
          event.preventDefault();
          let mrect=Menu.getrect();
          if(event.clientY+mrect[3]>body.height-5)
              screenPos[1]-=event.clientY+mrect[3]-body.height+5;
        }
        Menu.show([Menu.pos[0]+(screenPos[0]-mScreenPos[0]),
                   Menu.pos[1]+(screenPos[1]-mScreenPos[1])]);
        this.showing=true;
    }
    hide(layer=0){
      if(this.showing && layer==0){
        let events=this.events['hide'];
        for(let i=0;i<events.length;i++) events[i](layer);
      }
      if(layer==0) this.showing=false;
      for(let i=layer;i<this.menus.length;i++){
        for(let [name, Menu] of Object.entries(this.menus[i])){
          Menu.hide();
        }
      }
    }
    destroy(){
        this.frame.removeContextMenu(this);
        for(let i=0;i<this.menus.length;i++){
            for(let [name, Menu] of Object.entries(this.menus[i])){
              Menu.destroy();
            }
        }
    }
}

export class TransFormer extends Panel{
    constructor(parent){
        super(parent,[0,0],[100,100],{'cursor':'pointer','z-index':'1'});
        //====================================================================== 方向按鈕
        let tfr=this;
        let frame=this.getFrame();
        let directs=[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
        this.directBtns=[];
        this.speed=1;     //拖洩速度
        //-----------------------------------------------運算參數
        let nowBtn=null;              //目前按下的按鈕
        let lastPos=[0,0];            //上一個座標
        this.transformObj=null;   //目前的變換物件 [物件,]
        for(let i=0;i<directs.length;i++){
            let direct=directs[i];
            //------------------------------------------------建構按鈕
            let btnStyle={};
            if(direct[0]+direct[1]==0) btnStyle['cursor']='ne-resize';       //左上，右下
            else if(direct[0]-direct[1]==0) btnStyle['cursor']='nw-resize';  //左下，右上
            else if(direct[0]==0) btnStyle['cursor']='s-resize';             //上下
            else if(direct[1]==0) btnStyle['cursor']='w-resize';             //左右
            let btn=new DefaultButton(this,'',null,null,[16,16],btnStyle);
            btn.direct=direct;
            btn.addEvent('onmousedown',(event)=>{
                lastPos=[event.pageX,event.pageY];
                nowBtn=btn;
                let cusorStyle={'cursor':btnStyle['cursor']};
                //frame.setTemStyle(cusorStyle);
                tfr.setAbsPos([0,0]);
                tfr.setSize([frame.size[0]-50,frame.size[1]-50],cusorStyle)        //自身填滿屏幕
                tfr.trigger_event('transformdown');
            });
            this.directBtns.push(btn);
        }
        //====================================================================== 旋轉按鈕
        //let robtn=document.createElement('button');
        //robtn.style="width: 32px;height: 32px;border-radius:16px;border: 1px solid #000;cursor:grab;position:absolute;top:0px;";
        //robtn.innerHTML=html_img('rotate',[20,20]);
        //robtn.cursor='grabbing';
        //robtn.onmousedown=function (event){
        //    if(rsr.telement!=null){
        //        rsr.press_btn=robtn;
        //        let angle=rsr.telement.get_dict()['rotate'];
        //        if(angle==undefined) angle=0;
        //        let rect=rsr.telement.get_rect();
        //        rsr.telement.bdict['scale']=rect[3]+','+rect[2];
        //        rsr.telement.transform('rotate',parseInt(angle)+90);
        //    }
        //    //rsr.press_btn=this;
        //    //rsr.panel_cursor=rsr.panel.style.cursor;
        //    //rsr.now_panel().style.cursor=this.cursor;
        //    //resizer.style.cursor=this.cursor;
        //}
        //resizer.appendChild(robtn);
        //this.robtn=robtn;
        //document.body.appendChild(resizer);
        //this.resizer=resizer;
        //this.telement=null;          //未選定
        
        //====================================================================== transform事件
        function transformup(){
            if(nowBtn!=null && tfr.transformObj!=null){
                tfr.setSize([0,0]);
                nowBtn=null;
                tfr.trigger_event('transformup');
                tfr.locateBtns();
            }
        }
        this.newEvent(['transformdown','transform','transformup']);
        frame.addEvent('onmousemove',(event)=>{
            if(nowBtn!=null && tfr.transformObj!=null){
                if(event.buttons==0) transformup();
                else{
                    let nowPos=[event.pageX,event.pageY];
                    let incSize=[(nowPos[0]-lastPos[0])*nowBtn.direct[0]*tfr.speed,
                                 (nowPos[1]-lastPos[1])*nowBtn.direct[1]*tfr.speed];
                    let transformDict={'size':[Math.max(0,tfr.transformObj[0].size[0]+incSize[0]),
                                               Math.max(0,tfr.transformObj[0].size[1]+incSize[1])]};
                    tfr.transformObj[1](transformDict);
                    lastPos=nowPos;
                    tfr.trigger_event('transform');
                    this.locateBtns();
                }
            }
        });
        frame.addEvent('onmouseup',(event)=>{transformup();});
        //-----------------------------------------------------------
        this.hide();
    }
    locateBtns(){
        let apos=this.transformObj[0].getAbsPos();
        let size=this.transformObj[0].getComputedSize();
        for(let i=0;i<this.directBtns.length;i++){
            let btn=this.directBtns[i];
            btn.setPos([apos[0]+size[0]/2+size[0]*btn.direct[0]/2-8,
                        apos[1]+size[1]/2+size[1]*btn.direct[1]/2-8]);
        }
    }
    transform(baseObj,transformFunc=null){
        this.setAbsPos([0,0]);
        this.show();
        //---------------------------------------------
        if(transformFunc==null)
            transformFunc=(transformDict)=>{
                baseObj.setSize(transformDict['size']);
            }
        this.transformObj=[baseObj,transformFunc];
        this.locateBtns();
        
    }
    hide(){
        super.hide();
        this.transformObj=null;
    }
}

export function Wrap(parent,obj,wrap_class,size=null,_style=null){
    let container=new wrap_class(parent);
    obj.setParent(container);
    container.setStyle(_style);
    if(size==null){
        container.setSize(obj.size);
        obj.setPos([0,0]);
    }else{
        container.setSize(size);
        obj.setAlign('center','center');
    }
    return container;
}

export function sortObjs(obj_list,order_by){
    let box=[...obj_list];
    switch(order_by){
        case 'center_x':
            return box.sort((a,b)=>a.getCenter()[0]-b.getCenter()[0]);
        case 'center_y':
            return box.sort((a,b)=>a.getCenter()[1]-b.getCenter()[1]);
    }
    return box;
}
function AnimeFunc(obj,end_style,animeFunc=null){
    function anime_func(progress){
        obj.setrect([r[0]+(er[0]-r[0])*progress,r[1]+(er[1]-r[1])*progress,
                     r[2]+(er[2]-r[2])*progress,r[3]+(er[3]-r[3])*progress]);
        if(end_alpha!=undefined) obj.setAlpha(alpha+(end_alpha-alpha)*progress);
        if(animeFunc!=null) animeFunc(progress);
    }
    let r=obj.getrect();
    if(end_style['pos']) obj.setPos(end_style['pos']);
    if(end_style['size']) obj.setSize(end_style['size']);
    let alpha=obj.alpha;
    let end_alpha=end_style['alpha'];
    let er=obj.getrect();
    obj.setrect(r);
    return anime_func;
}
class Anime{
    constructor(anime_func,times){
        this.anime_func=anime_func;
        this.times=times;
        //--------------------------------
        this.progress=0;
        this.tk=0;
        this.status='pause';
    }
    run(){
        if(this.tk<this.times && this.status=='running'){
            this.tk+=1;
            this.progress=this.tk/this.times;
            this.anime_func(this.progress);
        }
        if(this.tk==this.times) this.end();
    }
    reset(){
        this.tk=0;
    }
    //------------------------------------
    start(){
        this.status='running';
        if(!body.animes.includes(this)) body.addAnime(this);
        body.runAnime();
    }
    restart(){
        this.reset();this.start();
    }
    pause(){
        this.status='pause';
    }
    end(){
        this.tk=this.times;
        this.status='end';
    }
}

export function getRelPos(baseObj,baseObj2){
    let rect=baseObj.getAbsPos();
    let rect2=baseObj2.getAbsPos();
    return [rect2[0]-rect[0],rect2[1]-rect[1]];
}