import { ArrayRemove, copyDict,getabsrect} from "../tool.js";
import { Base,Button,defaultStyle,Frame,Label,Panel, sortObjs, SwitchButton, voidPanel, Wrap} from "./base.js";

//水管
export class Tube extends Panel{
    constructor(parent,interval=5,direct='hr',pos=null,size=null,_style=null){
        //_style=defaultStyle(_style,{'border':'1px black solid'});
        super(parent,pos,size,_style);
        this.direct=direct;
        this.interval=interval;
        this.objs=[];
        this.show_direct=0;        //objs物件展示方向，0:依序顯示物件,1:倒序顯示物件
        this.type='tube';
    }
    setDirect(direct){         //轉換方向
        this.direct=direct;
        if(direct=='hr'){
            for(let i=0;i<this.objs.length;i++) this.objs[i].setY(0);
        }else{
            for(let i=0;i<this.objs.length;i++) this.objs[i].setX(0);
        }
        this.arrange();
    }
    setShowDirect(show_direct){
        this.show_direct=show_direct;
        this.arrange();
    }
    add_item(obj,size=null){
        let wrap=Wrap(this,obj,Panel,size);
        obj.wrap=wrap;
        this.objs.push(wrap);
        //----------------------------------------------
        this.arrange();
    }
    del_item(obj){
        this.removeChild(obj.wrap);
        ArrayRemove(this.objs,obj.wrap);
        this.arrange();
    }
    arrange(){
        let dim=0;   //當前維度
        let dim2=0;   //另一個維度
        for(let i=0;i<this.objs.length;i++){
            let k=i;
            if(this.show_direct==1) k=this.objs.length-i-1;
            let c_obj=this.objs[k];
            if(c_obj.showing){
                let c_size=c_obj.size;
                if(this.direct=='hr'){
                    c_obj.setX(dim);dim+=c_size[0]+this.interval;
                    dim2=Math.max(dim2,c_size[1]);
                }else{
                    c_obj.setY(dim);dim+=c_size[1]+this.interval;
                    dim2=Math.max(dim2,c_size[0]);
                }
            }
        }
        if(this.direct=='hr') this.setSize([dim-this.interval,dim2]);
        else this.setSize([dim2,dim-this.interval]);
        //----------------------------------------------------全體置中
        for(let i=0;i<this.objs.length;i++){
            if(this.direct=='hr') this.objs[i].setAlign(null,'center');
            else this.objs[i].setAlign('center');
        }
    }
}
export class MovableTube extends Tube{
    constructor(parent,interval=5,direct='hr',pos=null,size=null,_style=null){
//        _style=defaultStyle(_style,{'border':'1px black solid'});
        super(parent,interval,direct,pos,size,_style);
        this.type='movabletube';
    }
    setDirect(direct){
        for(let i=0;i<this.objs.length;i++){
            let obj=this.objs[i];
            if(direct=='hr') obj.setlimit('vr',false);
            else obj.setlimit('hr',false);
            obj.setlimit(direct);
        }
        super.setDirect(direct);
    }
    add_item(obj,size=null){
        let dragobj=Wrap(this,obj,DragObj,size);
        obj.wrap=dragobj;
        dragobj.setlimit(this.direct);
        dragobj.setlimit('parent');
        this.objs.push(dragobj);
        this.arrange();
        //-------------------------------------------------排列事件
        dragobj.loc=dragobj.pos;         //目標移動座標
        let mtube=this;
        dragobj.addEvent('drag',function(offset){
            let dpos=dragobj.pos;
            // console.log(dpos[0],orig);
            if(mtube.direct=='hr'){
                if(offset[0]<0) dragobj.setX(dpos[0]-dragobj.size[0]/2);
                else dragobj.setX(dpos[0]+dragobj.size[0]/2);
                mtube.objs=sortObjs(mtube.objs,'center_x');
            }else{
                if(offset[1]<0) dragobj.setY(dpos[1]-dragobj.size[1]/2);
                else dragobj.setY(dpos[1]+dragobj.size[1]/2)
                mtube.objs=sortObjs(mtube.objs,'center_y');
            }
            mtube.arrange();
            dragobj.setPos(dpos);
        });
        dragobj.addEvent('onmouseup',function(event){mtube.arrange();});
        
    }
}

//排版
export class FlexTube extends Panel{
    constructor(parent=-1,interval=5,direct='hr',pos=null,size=null,_style=null){
        super(parent,pos,size,_style);
        this.direct=direct;
        this.interval=interval;           //元素間隔
        this.tubes=[                      //三個tube
            new Tube(this,interval,direct),
            new Tube(this,interval,direct),
            new Tube(this,interval,direct)
        ];
        this.type='tube';
    }
    arrange(){
        for(let i=0;i<3;i++){
            let size=this.tubes[i].size;
            if(size[0]>this._element.offsetWidth && this._style['width'].slice(-1)!='%')
                this.setWidth(size[0]);
            if(size[1]>this._element.offsetHeight && this._style['height'].slice(-1)!='%')
                this.setHeight(size[1]);
        }
        if(this.direct=='hr'){
            this.tubes[0].setAlign('left','center');
            this.tubes[1].setAlign('center','center');
            this.tubes[2].setAlign('right','center');
        }else{
            this.tubes[0].setAlign('center','top');
            this.tubes[1].setAlign('center','center');
            this.tubes[2].setAlign('center','bottom');
        }
    }
    add_item(obj,loc='left',size=null){ //offset:溢出寬高
        if(!(typeof loc=='number')) loc={'left':0,'top':0,'center':1,'right':2,'bottom':2}[loc];
        this.tubes[loc].add_item(obj,size);
        this.arrange();
    }
    setStyle(_style){
        super.setStyle(_style);
    }
}

export class NavBar extends FlexTube{
    constructor(parent=-1,interval=5,_style=null){
        _style=defaultStyle(_style,{'min-height':'10px'});
        super(parent,interval,'hr',[0,0],['100%','auto'],_style);
        let nav=this;
        let arrange_lock=false;
        this.addEvent('resize',function(size){
            if(!arrange_lock){
                arrange_lock=true;
                nav.arrange();
                arrange_lock=false;
            }
        })
        this.type='navbar';
    }
}
export class FooterBar extends FlexTube{
    constructor(parent=-1,interval=5,_style=null){
        _style=defaultStyle(_style,{'min-height':'10px'});
        super(parent,interval,'hr',null,['100%','auto'],_style);
        this.setAlign(null,'bottom');
        let footer=this;
        this.parent.addEvent('resize',function(size){
            footer.arrange();
            footer.setAlign(null,'bottom');
        })
        this.type='footerbar';
    }
    add_item(obj,loc='left',size=null){
        super.add_item(obj,loc,size);
        this.setAlign(null,'bottom');
    }
}
export class Modal extends Frame{
    constructor(parent,title,size,check_func=null){
        super(parent,[0,0],['100%','100%'],{'position': 'fixed','z-index':'1','background-color': 'rgba(0, 0, 0, 0.4)'});
        function close_modal(){modal.hide();}
        let modal=this;
        let container=new Panel(this,null,size,{
            'background-color': '#fff','border':'1px solid #888','overflow':'hidden',
            'box-shadow':'0 4px 8px rgba(0, 0, 0, 0.2)','border-radius': '15px'
        });
        //container.fixedSize();
        let crect=container.getrect();
        //置中container
        container.setAlign('center','center');
        //----------------------------------------------------------------------------header
        let header=new NavBar(container,5,{'background-color':'grey'});
        let mtitle=new Label(-1,title,null,null,{'color':'white','padding':'4px 8px','font-size':'20px'});
        header.add_item(mtitle,'center');
        let _close=new Button(-1,'&times;',close_modal,null,null,{
            'color':'#aaa','font-size':'30px','font-weight':'bold',
            'cursor':'pointer','background-color':'transparent','border':'0px'
        });
        header.add_item(_close,'right');
        //----------------------------------------------------------------------------body
        let body=new Panel(container,[0,header.getrect()[3]],['100%',crect[3]-100],{'padding':'10px 10px'});
        //----------------------------------------------------------------------------footer
        let footer=new FooterBar(container,5,{'background-color':'grey'});
        let btn_style={'padding':'8px 16px','font-size':'14px','cursor':'pointer',
            'border':'none','border-radius':'4px'};
        let canel_btn=new Button(-1,'取消',close_modal,null,null,defaultStyle(btn_style,{'background-color':'#ccc'}));
        footer.add_item(canel_btn,'right');
        if(check_func==null) canel_btn.setLabel('關閉'); 
        else{
          canel_btn.setLabel('取消');
          let check_btn=new Button(-1,'確認',function (){check_func();modal.hide();},null,null,
                                    defaultStyle(btn_style,{'background-color':'#4CAF50','color':'white'}));
          footer.add_item(check_btn,'right');
        }
        footer.add_item(voidPanel([0,0]),'right');
        this.hide();
        //---------------------------------------------------------------
        this._container=container;
        this.header=header;
        this.body=body;
        this.footer=footer;
    }
    loadHTML(html){
        this.body.loadHTML(html);
    }
    launch(){
        this._container.setAlign('center','center');
        this.show();
    }
}

export class DragObj extends Panel{
    constructor(parent=-1,pos=null,size=null,_style=null){
        _style=defaultStyle(_style,{'cursor':'grab','user-select':'none'});
        super(parent,pos,size,_style);
        this.bind_objs=[];
        this._lock_setting=[false,false];   //水平或垂直鎖定
        //-----------------------------------------拖動設定
        let clientX = 0;
        let clientY = 0;
        this.dragging = false;
        let dbj=this;
        this.limit_domain=[null,null];    //[htmlElement,offsetRect]
        this.limit_direct={
            'hr':false,          //僅能水平移動
            'vr':false,          //僅能垂直移動
        }
        function dragEnd(event){
            dbj.dragging=false;
            frame.setStyle();
            dbj.trigger_event('drag-end',event);
        }
        //---------------------------------------------------------------------------
        this.addEvent('onmousedown',function (event){
            dbj.dragging=true;
            clientX = event.clientX ;
            clientY = event.clientY ;
            frame.setTemStyle({'cursor':'grabbing'});
            dbj.trigger_event('drag-start',event);
        });
        let frame=this.getFrame();
        this.parents=this.getParents();
        frame.addEvent('onmousemove',function (event){
            if(dbj.dragging){
                if(event.buttons==1){
                    let offset=[event.clientX-clientX,event.clientY-clientY];
                    if(dbj.limit_direct['hr']) offset[1]=0;    //水平鎖定
                    if(dbj.limit_direct['vr']) offset[0]=0;    //垂直鎖定

                    clientX = event.clientX ;
                    clientY = event.clientY ;
                    //-------------------------------------
                    offset=dbj.move(offset);
                    //這裡有bind 2個同血親物件會移動2次的特性
                    for(let i=0;i<dbj.bind_objs.length;i++){
                        let obj=dbj.bind_objs[i];
                        obj.move(offset);
                        if(dbj.parents.includes(obj)) dbj.move([-offset[0],-offset[1]]);
                    }
                    dbj.trigger_event('drag',offset);
                }else dragEnd(event);
            }
        });
        this.addEvent('onmouseup',function (event){dragEnd(event);});
        //-----------------------------------------------------------------
        Object.assign(this.events,{'drag':[],'drag-start':[],'drag-end':[],'move':[]});
        this.type='dragobj';
    }
    bind(obj){
        this.bind_objs.push(obj);
    }
    setlimit(limit,value=true){
        this.limit_direct[limit]=value;
    }
    setDomain(baseObj,offsetRect=null){         //設定[自身可移動範圍]在[某baseObj的矩形]+[偏移offsetRect]
        if(baseObj.base=='base') baseObj=baseObj._element;
        if(offsetRect==null) offsetRect=[0,0,0,0];
        this.limit_domain=[baseObj,offsetRect];
    }
    setParent(parent){
        super.setParent(parent);
        this.parents=this.getParents();
    }
    move(offset){
        //let rect=this.getrect();
        let opos=[this.pos[0],this.pos[1]];
        if(this.limit_domain[0]!=null){
            let drect=getabsrect(this.limit_domain[0]);  //[x,y,w,h]
            let orect=this.limit_domain[1];  //[左→,上↓,右→,下↓]
            drect=[drect[0]+orect[0],drect[1]+orect[1],drect[0]+drect[2]+orect[2],drect[1]+drect[3]+orect[3]];
            // drect=[最左,最頂,最右,最底]
            //此時 drect 為自身 arect 不可超出的矩形
            let arect=this.getabsrect();
            //nrect無法超出drect的範圍
            let npos=[Math.min(Math.max(drect[0],arect[0]+offset[0]),drect[2]-arect[2]),
                      Math.min(Math.max(drect[1],arect[1]+offset[1]),drect[3]-arect[3])];
            offset=[npos[0]-arect[0],npos[1]-arect[1]];
        }
        super.move(offset);
        this.trigger_event('move',offset);
        return [this.pos[0]-opos[0],this.pos[1]-opos[1]];
    }
}
export class ResizeObj extends Panel{
    constructor(parent,side=5,pos,size,_style=null){  //pos,size:不包含container
        let container=new Panel(parent,pos,size);
        _style=defaultStyle({'padding':'0px','overflow':'hidden'});
        super(container,[side,side],size,_style);
        this.container=container;
        this.side=side;
        let frame=this.getFrame();
        let clientX = 0;
        let clientY = 0;
        let dragging = false;
        let nowbtn=null;
        let rbj=this;
        function reset_cursor(){
            frame.setStyle();
            for(let s=0;s<rbj.btns.length;s++){
                rbj.btns[s].setStyle();
            }
        }
        frame.addEvent('onmousemove',function (event){
            if(dragging){
                if(event.buttons==1){
                    if(nowbtn!=null){
                        let direct=nowbtn.direct;
                        let offset=[(event.clientX-clientX)*direct[0],(event.clientY-clientY)*direct[1]];
                        clientX = event.clientX ;
                        clientY = event.clientY ;
                        rbj.setSize([rbj._element.offsetWidth+offset[0],rbj._element.offsetHeight+offset[1]]);
                        let move=[0,0];
                        if(direct[0]<0) move[0]=-offset[0];
                        if(direct[1]<0) move[1]=-offset[1];
                        if(move[0]!=0 || move[1]!=0) container.move(move); 
                        for(let s=0;s<rbj.btns.length;s++){
                            rbj.btns[s].setTemStyle({'cursor':nowbtn._style['cursor']});
                        }
                    }
                }else{
                    dragging=false;
                    nowbtn=null;
                    reset_cursor();
                }
            }
        });
        //---------------------------------------------------------------------------
        let directs=[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
        this.btns=[];
        for(let i=0;i<directs.length;i++){
            let direct=directs[i];
            let b_style={'padding':'0px','background-color':'transparent'};
            b_style['cursor']=['nwse-resize','ns-resize','nesw-resize','ew-resize'][i%4];
            let btn=new Button(container,'',null,null,null,b_style);
            btn.setHover();
            btn.direct=direct;
            this.btns.push(btn);
            //----------------------------------------------------------------------------
            btn.addEvent('onmousedown',function (event){
                nowbtn=btn;
                dragging=true;
                clientX = event.clientX ;
                clientY = event.clientY ;
                frame.setTemStyle({'cursor':btn._style['cursor']});
            });
            btn.addEvent('onmouseup',function (event){dragging = false;nowbtn=null;reset_cursor();});
        }
        this.setSize(size);
        this.type='resizeobj';
    }
    show(){
        this.container.show();
        this.showing=true;
    }
    hide(){
        this.container.hide();
        this.showing=false;
    }
    setSize(size,_style){
        super.setSize(size,_style);
        //-------------------------------------------------------
        let side=this.side;
        //console.log(this._element.offsetWidth+side*2,this._element.offsetHeight+side*2);
        let bsize=[this._element.offsetWidth/2,this._element.offsetHeight/2];
        let center=[bsize[0]+side,bsize[1]+side];
        this.container.setSize([center[0]*2,center[1]*2]);
        for(let i=0;i<this.btns.length;i++){
            let btn=this.btns[i];
            let direct=btn.direct;
            let btnSize=[side,side];
            let pos=[center[0]+bsize[0]*direct[0],center[1]+bsize[1]*direct[1]];
            if(Math.abs(direct[0]+direct[1])==1){
                if(direct[0]==0) btnSize[0]=bsize[0]*2;
                else btnSize[1]=bsize[1]*2;
                pos[0]-=bsize[0]*Math.abs(direct[1]);
                pos[1]-=bsize[1]*Math.abs(direct[0]);
            }
            btn.setSize(btnSize);
            if(direct[0]<0) pos[0]-=side;
            if(direct[1]<0) pos[1]-=side;
            btn.setPos(pos);
        }
        //------------------------------------------------觸發resize事件
        this.trigger_event('resize',[this._element.offsetWidth,this._element.offsetHeight]);
    }
    //------------------------------------------------------------------動畫
    runAnime(anime_style,times,animeFunc=null){
        let container_style=copyDict(anime_style,['size']);
        this.container.runAnime(container_style,times,animeFunc);
        if(anime_style['size'])
            super.runAnime({'size':anime_style['size']},times);
    }
}

export function widget(widgetName,params,config=null){
    if(config==null) config={};
    //----------------------------------------------------------
    let obj;
    if(widgetName=='button') obj=new Button(...params);
    else if(widgetName=='switchbutton') obj=new SwitchButton(...params);
    //----------------------------------------------------------
    if(config['hover']) obj.setHover(...config['hover']);
    return obj;
}