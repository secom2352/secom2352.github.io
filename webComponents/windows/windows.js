import { ArrayRemove, defaultDict, html_img, NowTime, RangeArray } from "../tool.js";
import { Button, ContextMenu, Frame, Label, Panel, SwitchButton, voidPanel } from "../ui/base.js";
import { DragObj, FooterBar, MovableTube, NavBar, ResizeObj, Tube } from "../ui/widget.js";

export class WinManager{
    constructor(system){
        this.system=system;
        this.handlers={};
        this.windows=[];
        //------------------------------視窗
        let container=new Frame(system.screen,[0,0],['100%','100%'],{'background-color':'#cccccc'});
        //container.type='w.container';
        let workspace=new Panel(container,[0,0],['100%',container.size[1]-40],{'overflow':'hidden'});
        //workspace.type='w.workspace';
        container.addEvent('resize',function(size){
            workspace.setHeight(size[1]-40);
        });
        this.container=container;
        this.workspace=workspace;
        //-------------------------------------------------------------------------工作列
        this.btn_size=[30,30];
        let taskbar=new TaskBar(this);
        //-------------------------------------
        this.taskbar=taskbar;
        //------------------------------------
        this.TopLayer=0;
    }
    newAppWindow(app){
        let hid=app.hid;
        if(this.handlers[hid]==undefined)
            this.handlers[hid]=new AppWindowHandler(this,app);
        let appwindow=this.handlers[hid].newAppWindow();
        return appwindow;
    }
    registerAppWindow(appwindow){
        this.TopLayer++;
        this.windows.push(appwindow);
        for(let i=0;i<this.windows.length;i++)
            this.windows[i].is_focused=false;
        appwindow.setLayer(this.TopLayer);
        this.focus(appwindow);
    }
    unregisterAppWindow(appwindow){
        this.focus(appwindow);
        this.TopLayer--;
        ArrayRemove(this.windows,appwindow);
        //-------------------------------------------將第二高的視為至頂
        this.focus();
    }
    getVoidLayer(){
        //----------------------------尋找空layer(0~top)設定給appwindow
        let voidLayers=RangeArray(1,this.TopLayer+1);
        for(let i=0;i<this.windows.length;i++){
            let aw=this.windows[i];
            if(aw.showing) ArrayRemove(voidLayers,aw.layer);
        }
        return voidLayers[0];
    }
    update_desktop(){
        let o=this.system.listdir('desktop');
        for(let i=0;i<o.length;i++){}
    }
    //-----------------------------------------------顯示狀態
    show(appwindow){
        appwindow.show();
    }
    focus(appwindow=null){
        if(appwindow==null){
            let topbox=[-1,null];
            for(let i=0;i<this.windows.length;i++){
                let aw=this.windows[i];
                if(aw.showing && aw.layer>topbox[0]) topbox=[aw.layer,aw];
            }
            if(topbox[1]!=null) this.focus(topbox[1]);
        }
        else{
            if(!appwindow.showing) appwindow.show();
            else if (!appwindow.is_focused){
                let layer=appwindow.layer;
                for(let i=0;i<this.windows.length;i++){
                    let aw=this.windows[i];
                    if(aw.showing){
                        if(aw.layer>=layer) aw.downLayer();
                        aw.handler.unfocus();
                        aw.unfocus();
                        //aw.content.loadHTML(''+aw.layer);
                    }
                }
                appwindow.setLayer(this.TopLayer);
                appwindow.handler.focus();
                appwindow.is_focused=true;
                appwindow.focus();
                //appwindow.content.loadHTML(''+appwindow.layer);
            }
        }
    }
    minimize(appwindow){
        appwindow.minimize();
        //appwindow.zoomto([0,0,100,100]);
    }
    hide(appwindow){
        appwindow.hide();
        appwindow.handler.hide();
    }
    close(appwindow){
        appwindow.close();
    }
}
class TaskBar extends FooterBar{
    constructor(winmanager){
        super(winmanager.container,10,{'background-color':'#999999'});
        this.tubes[2].setShowDirect(1);
        //--------------------------------------------------------
        this.manager=winmanager;
        let bsize=winmanager.btn_size;
        this.setHeight(bsize[1]+10);
        this.system=winmanager.system;
        let tb=this;
        //----------------------------------------------------------------------------
        this.add_item(voidPanel([0,30]));
        this.add_item(voidPanel([10,30]),'right');
        //=====================================================================開始
        this.addMainButton('windows',function(event){
            tb.system.launch(function(api,params){
                console.log('開始');
                let win=api('new window');
                let panel=win.content;
                panel.fill('#ffffff');
            });
        });
        //=====================================================================應用程式
        let apptube=new MovableTube(-1,10,'hr',null,[0,36]);
        this.add_item(apptube);
        //=====================================================================時間
        function setTime(){
            let nt=new NowTime();
            let apm=['上',parseInt(nt.hours)];
            if(apm[1]>=12) apm[0]='下';
            if(apm[1]>12) apm[1]-=12;
            if(apm[1]<10) apm[1]='0'+apm[1];
            time_btn.setLabel(`${apm[0]}午 ${apm[1]}:${nt.minutes}<br/>${nt.year}/${nt.month}/${nt.day}`);
        }
        let time_btn=new SwitchButton(-1,'',()=>{winmanager.container.FullScreen();},()=>{document.exitFullscreen();},{'background-color':'#00000020'},null,[80,36]);
        this.add_item(time_btn,'right');
        setInterval(setTime,1000);
        setTime();
        //-----------------------------------------------------------------------------
        this.apptube=apptube;
        //let start_btn=new Button(-1,html_img('windows',bsize),,null,bsize);
        //this.add_item(start_btn,'left',[bsize[0]+5,bsize[1]+5]);
        this.type='taskbar';
    }
    addMainButton(icon,onclick){
        let bsize=this.manager.btn_size;
        let btn=new Button(-1,html_img(icon,bsize),onclick,null,bsize);
        this.add_item(btn,'left',[bsize[0]+6,bsize[1]+6]);
        btn.setHover();
        btn.parent.setHover({'background-color':'#ffffff50'});
    }
    addAppButton(button){
        let bsize=this.manager.btn_size;
        this.apptube.add_item(button,[bsize[0]+6,bsize[1]+6]);
        //this.add_item(button,'left');
    }
    delAppButton(button){
        this.apptube.del_item(button);
    }
}

export class AppWindowHandler{
    constructor(winmanager,app){
        this.manager=winmanager;
        this.app=app;
        //-----------------------------
        let bsize=winmanager.btn_size;
        this.windows=[];
        let handler=this;
        this.hoverbg='#ffffff50';
        //-------------------------------------------主按鈕
        let button=new Button(-1,html_img(app.config['icon'],bsize),function(event){
            if(handler.windows.length==0){app.run();}
            else if(handler.windows.length==1){
                let aw=handler.windows[0];
                if(aw.showing){
                    if(aw.is_focused) aw.minimize();
                    else aw.focus();
                }else aw.show();
            }else{
                let ar=button.getabsrect();
                windowtube.setLayer(winmanager.TopLayer+1);
                windowtube.show([ar[0]+(ar[2]-windowtube.size[0])/2,ar[1]-10-windowtube.size[1]]);
            }
        },null,bsize);
        winmanager.taskbar.addAppButton(button);
        button.parent.setStyle({'cursor':'default'});
        button.setHover();
        button.parent.setHover({'background-color':this.hoverbg});
        //-----------------------------------------------------------------多視窗選項
        let windowtube=new Tube(winmanager.container,0,'hr',null,null,
            {'visibility':'hidden','background-color':'white','border-radius': '5px'});
        winmanager.container.addEvent('onmousedown',function(event){windowtube.hide();});
        this.windowtube=windowtube;
        //-------------------------------------------右鍵選單
        let contextmenu=new ContextMenu(winmanager.workspace);
        contextmenu.addMenu(0,'handler',[
            ['重開一個',function (event){app.run();}],
            ['釘選到工作列',function(event){handler.pinned=true;}],
            ['關閉所有視窗',function(event){
                let windows=[...handler.windows];
                for(let i=0;i<windows.length;i++) windows[i].close();
            }]
        ]);
        button.addEventListener('contextmenu', function(event){
            if(button._enable){
                contextmenu.setLayer(winmanager.TopLayer+1);
                contextmenu.show_above('handler',button,'center',event);
            }
        });
        this.menu=contextmenu;
        //---------------------------------------------------
        this.button=button;
        this.pinned=true;      //被釘選
        this.showing=button.showing;
    }
    newAppWindow(){
        let appwindow=new AppWindow(this);
        this.manager.registerAppWindow(appwindow);
        this.windows.push(appwindow);
        //---------------------------------------添加子視窗
        let handler=this;
        let sub_btn=new Button(-1,'',function(event){
            appwindow.show();
            handler.windowtube.hide();
        },null,[100,100]);
        let vsp=new Label(sub_btn,'視窗'+this.windows.length,[20,20],[60,60],
            {'background-color':'black','color':'white','cursor':'pointer'});
        sub_btn.stopPropagation('onmousedown');
        this.windowtube.add_item(sub_btn);
        appwindow._handlerWindow=sub_btn;
        //--------------------------------------
        return appwindow;
    }
    closeAppWindow(appwindow){
        this.unfocus();
        ArrayRemove(this.windows,appwindow);
        this.manager.unregisterAppWindow(appwindow);
        if(this.windows.length==0 && !this.pinned){
            this.menu.destroy();
            this.manager.taskbar.delAppButton(this.button);
        }
        this.windowtube.del_item(appwindow._handlerWindow);
        appwindow.window.container.destroy();
    }
    //----------------------------------
    show(){
        this.button.show();
        this.showing=this.button.showing;
    }
    hide(){
        this.button.hide();
        this.showing=this.button.showing;
    }
    //-----------------------------------
    focus(){
        this.button.parent.setBg(this.hoverbg);
    }
    unfocus(){
        this.button.parent.setBg('transparent');
    }
}

export class AppWindow{
    constructor(handler,config=null){
        this.handler=handler;
        let manager=handler.manager;
        this.manager=manager;
        let workspace=manager.workspace;
        let appwindow=this;
        //-------------------------------------------
        config=defaultDict(config,{'pos':[100,100],'size':[600,300]});
        //--------------------------------------------
        let appwindow_style={'border':'1px solid #888','overflow':'hidden','opacity':0,
                'box-shadow':'0 4px 8px rgba(0, 0, 0, 0.2)','border-radius': '10px'};
        let _window=new ResizeObj(manager.workspace,5,handler.button.getAbsPos(),[5,5],appwindow_style);
        _window.setSize([_window.size[0],_window.size[1]+30]);
        //------------------------------------------
        _window.addEvent('onmousedown',function(event){
            manager.focus(appwindow);
        });
        //--------------------------------------------------------------------------------
        let dragobj=new DragObj(_window,[0,0],['100%',30]);
        dragobj.bind(_window.container);
        //-------------------------------------------------------------------------頂部控制列navbar
        let ctrlbtn_style={'font-size':'16px','background-color':'transparent','color':'black'};
        function ctrlButton(label,onclick){                                    //控制按鈕
            let btn=new Button(-1,label,onclick,null,[30,30],ctrlbtn_style);
            return btn;
        }
        dragobj.setSize(['100%',30]);
        let navbar=new NavBar(dragobj,0,{'background-color':'#eeeeee'});
        let small=ctrlButton('-',function(event){manager.minimize(appwindow);});
        navbar.add_item(small,'right');
        //==============================================================
        this._pre_rect=null;
        let big=ctrlButton('□',function(event){
            if(!appwindow.is_maximum) appwindow.maximize();
            else appwindow.restore();
        });
        workspace.addEvent('resize',function(size){if(appwindow.is_maximum) appwindow.maximize();});
        navbar.add_item(big,'right');
        this.big=big;
        //==============================================================
        let close=ctrlButton('×',function(event){manager.close(appwindow);});
        navbar.add_item(close,'right');
        //-------------------------------------------------------------------------視窗body
        let contentFrame=new Frame(_window,[0,30],['100%',_window.size[1]-30],{'background-color':'black','overflow':'hidden'});
        _window.addEvent('resize',function(size){contentFrame.setHeight(size[1]-30);});
        let content=new Panel(contentFrame,[0,0],['100%','100%'],{'background-color':'transparent','overflow':'auto'});
        //this.addEvent('resize',function(size){content.setSize(size);});
        //-----調整大小時，一併調整 控制列 與 body
        _window.addEvent('resize',function(size){content.setSize([size[0],size[1]-30]);});
        //-----------------------------------------------視窗風格
        _window.setStyle({'box-shadow':'0 4px 8px rgba(0, 0, 0, 0.4)','border-radius': '10px'});
        //------------------------------------------------------------------------------
        this.window=_window;
        this.navbar=navbar;
        this.content=content;
        //--------------------------
        this.showing=_window.showing;
        this.is_focused=false;
        this.layer=null;
        this.is_maximum=false;
        this._rectBeforeZoom=null;
        //-----------------------------------------------------啟動動畫
        this.zoomto(config['pos'],config['size'],1);
    }
    //------------------------------顯示層
    setLayer(layer){
        this.layer=layer;
        this.window.container.setStyle({'z-index':layer+''});
    }
    downLayer(){
        this.layer--;
        this.window.container.setStyle({'z-index':this.layer+''});
        //console.log('被downlayer');
    }
    zoomto(container_pos,window_size,alpha,anime_func=null){
        let _window=this.window;
        this._rectBeforeZoom=[_window.container.pos[0],_window.container.pos[1],_window.size[0],_window.size[1]];
        //_window.container.runAnime({'pos':container_pos,'alpha':alpha},5);
        //_window.runAnime({'size':window_size},5,anime_func);
        _window.runAnime({'pos':container_pos,'size':window_size,'alpha':alpha},5,anime_func);

    }
    //--------------------------------------------------------------------------視窗操控語法
    unfocus(){
        this.is_focused=false;
        this.window.setStyle({'box-shadow':'0 4px 8px rgba(0, 0, 0, 0.2)'});
    }
    focus(){
        this.manager.focus(this);
        this.window.setStyle({'box-shadow':'0 4px 8px rgba(0, 0, 0, 0.4)'});
    }
    show(){          //顯示並focus
        if(!this.showing){
            let _window=this.window;
            _window.show();
            this.setLayer(this.manager.getVoidLayer());
            let rbz=this._rectBeforeZoom;
            if(this.is_maximum){
                let size=this.manager.workspace.size;
                rbz=[-_window.side,-_window.side,size[0],size[1]]
            }
            if(this._rectBeforeZoom!=null){
                _window.runAnime({'pos':[rbz[0],rbz[1]],'size':[rbz[2],rbz[3]],'alpha':1},5);
                this._rectBeforeZoom=null;
            }
            this.showing=_window.showing;
            
        }
        this.manager.focus(this);
    }
    hide(){
        this.is_focused=false;
        this.window.hide();
        this.showing=this.window.showing;
    }
    minimize(){
        let appwindow=this;
        let hdbutton=this.handler.button;
        let pos=hdbutton.getAbsPos();
        this.zoomto([pos[0],pos[1]],hdbutton.size,0.5,function (progress){
            if(progress==1){
                appwindow.hide();
                appwindow.manager.focus();
                appwindow.handler.unfocus();
            }
        });
    }
    restore(){
        let pr=this._pre_rect;
        if(pr!=null){
            this.big.setLabel('□');
            this.window.setStyle({'border-radius':'10px'});
            this.zoomto([pr[0],pr[1]],[pr[2],pr[3]],1);
        }
        this.is_maximum=false;
    }
    maximize(){
        if(this.showing){
            let _window=this.window;
            let workspace=this.manager.workspace;
            if(this.is_maximum){
                let side=_window.side;
                let size=workspace.size;
                _window.container.setrect([-side,-side,size[0]+side*2,size[1]+side*2]);
                _window.setSize(size,{'border-radius':'0px'});
            }else{
                this.big.setLabel(html_img('minimize',[30,30]));
                this._pre_rect=[_window.container.pos[0],_window.container.pos[1],_window.size[0],_window.size[1]];
                //maximizeWindow();
                let side=_window.side;
                let size=workspace.size;
                this.zoomto([-side,-side],size,1,function(progress){
                    if(progress==1) _window.setStyle({'border-radius':'0px'});
                });
                this.is_maximum=true;
            }
            
        }
    }
    fullsceen(){}
    close(){
        let appwindow=this;
        let _window=this.window;
        let apos=_window.getAbsPos();
        let center=[apos[0]+_window.size[0]/2,apos[1]+_window.size[1]/2];
        _window.runAnime({'pos':center,'size':[0,0],'alpha':0},5,function(process){
            if(process==1) appwindow.handler.closeAppWindow(appwindow);
        });
    }
}