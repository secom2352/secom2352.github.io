import { html_img } from "../tool.js";
import { Button, Frame, Panel } from "../ui/base.js";
import { DragObj, NavBar, ResizeObj, FooterBar, MovableTube } from "../ui/widget.js";

export class UserWindow extends Frame{
    constructor(system){
        super(-1,[0,0],['100%','100%'],{'background-color':'grey','overflow':'hidden'});
        this.system=system;
        let uw=this;
        //-------------------------------------------------------------------工作列
        let workbar=new FooterBar(this,3,{'background-color':'#cccccc'});
        //"開始"按鈕
        let start_btn=new Button(-1,html_img('windows',[30,30]),function(event){
            system.launch();
        });
        workbar.add_item(start_btn);
        //應用列條
        let apptube=new MovableTube(-1,2,'hr');
        workbar.add_item(apptube);
        this.apptube=apptube;

        this.workbar=workbar;
        //-------------------------------------------------------------------視窗計算參數
        this.appwindows=[];
        this.z_max=-1;
    }
    newAppWindow(){
        //---------------------------------------------建立視窗
        let aw=new AppWindow(this,[100,50],[650,300]);
        aw.content.setStyle({'background-color':'black'});
        this.appwindows.push(aw);
//        this.apptube.add_item(aw.workbtn);     //添加工作按鈕
        //-------------layer
        this.z_max++;
        aw.container.setStyle({'z-index':this.z_max});
        //----------------------------------------------工作按鈕
        //let uw=this;
        //let workbtn=new Button(-1,html_img('border_all',[30,30]),function(event){
        //    if(aw.showing){
        //        if(aw.getLayer()==uw.z_max) uw.minimize(aw);
        //        else uw.focus(aw);
        //    }else uw.focus(aw);
        //});
        //this.workbar.add_item(workbtn);

    }
    //-----------------------------------------------視窗狀態
    //無按鈕也無視窗
    hide(appwindow){
        appwindow.hide();
        appwindow.workbtn.hide();
        this.apptube.arrange();
    }
    //有按鈕有視窗
    show(appwindow){
        appwindow.show();
        appwindow.workbtn.show();
        this.apptube.arrange();
    }
    //有按鈕有視窗，且顯示在頂部
    focus(appwindow){
        if(!appwindow.showing) appwindow.show();
        let z_index=appwindow.getLayer();
        for(let i=0;i<this.appwindows.length;i++){
            let aw=this.appwindows[i];
            let zindex=aw.getLayer();
            if(zindex>z_index){
                aw.container.setStyle({'z-index':(zindex-1)+''});
            }
        }
        appwindow.container.setStyle({'z-index':(this.z_max)+''});
    }
    //有按鈕無視窗
    minimize(appwindow){}
    //移除按鈕及視窗
    close(appwindow){}
}

export class UserWindow2 extends Frame{
    constructor(){
        super(-1,[0,0],['100%','100%'],{'background-color':'grey','overflow':'hidden'});
        this.type='userwindow';
        //------------------------------------------------------------------------------
        let uw=this;
        let workbar=new WorkBar(this,3,{'background-color':'#cccccc'});
        let start_btn=new Button(-1,html_img('windows',[30,30]),function(event){
            uw.launch();
        });
        workbar.add_item(start_btn);
        this.workbar=workbar;
        //-------------------------------------------------------------------------------
        this.appwindows=[];
        this.z_max=-1;
    }
    launch(software_func=null){
        //---------------------------------------------創造視窗
        let aw=new AppWindow(this,[100,50],[650,300]);
        this.appwindows.push(aw);
        //----------------------------------------------顯示layer
        this.z_max++;
        aw.container.setStyle({'z-index':this.z_max});
        //-------------------------------------------------開始渲染
        if(software_func!=null) software_func(aw);
        else aw.content.setStyle({'background-color':'black'});
        //------------------------------------------------
        let uw=this;
        let workbtn=new Button(-1,html_img('border_all',[30,30]),function(event){
            if(aw.showing){
                if(aw.getLayer()==uw.z_max) uw.minimize(aw);
                else uw.focus(aw);
            }else uw.focus(aw);
        });
        this.workbar.add_item(workbtn);
    }
    minimize(appwindow){
        appwindow.hide();
        //-----------------------------------------尋找第二頂層的focus它
        let obj_max=[null,-1];
        for(let i=0;i<this.appwindows.length;i++){
            let aw=this.appwindows[i];
            if(aw.showing && aw.getLayer()>obj_max[1]) obj_max=[aw,aw.getLayer()];
        }
        if(obj_max[0]!=null) this.focus(obj_max[0]);
    }
    focus(appwindow){
        if(!appwindow.showing) appwindow.show();
        let z_index=appwindow.getLayer();
        for(let i=0;i<this.appwindows.length;i++){
            let aw=this.appwindows[i];
            let zindex=aw.getLayer();
            if(zindex>z_index){
                aw.container.setStyle({'z-index':(zindex-1)+''});
            }
        }
        appwindow.container.setStyle({'z-index':(this.z_max)+''});
    }

}

class AppWindow extends ResizeObj{
    constructor(userwindow,pos,size){      //pos:視窗位置(包含navbar), size:內容大小(不含navbar)
        let appwindow_style={'border':'1px solid #888','overflow':'hidden',
            'box-shadow':'0 4px 8px rgba(0, 0, 0, 0.2)','border-radius': '10px'};
        super(userwindow,5,pos,size,appwindow_style);
        this.type='appwindow';
        this.setSize([this._element.offsetWidth,this._element.offsetHeight+30]);
        //------------------------------------------
        let appwindow=this;
        this.addEvent('onmousedown',function(event){
            userwindow.focus(appwindow);
        });
        //--------------------------------------------------------------------------------
        let rect=this.getrect();
        let dragobj=new DragObj(this,[0,0],[rect[0],30]);
        dragobj.bind(this.container);
        //-------------------------------------------------------------------------頂部控制列navbar
        let ctrlbtn_style={'font-size':'16px','background-color':'transparent','color':'black'};
        function ctrlButton(label,onclick){                                    //控制按鈕
            let btn=new Button(-1,label,onclick,null,[30,30],ctrlbtn_style);
            return btn;
        }
        dragobj.setSize([rect[2],30]);
        //drag.bind(this);
        let navbar=new NavBar(dragobj,0,{'background-color':'#eeeeee'});
        let small=ctrlButton('-',function(event){userwindow.minimize(appwindow);});
        navbar.add_item(small,'right');
        let big=ctrlButton('□',function(event){
            appwindow.container.setPos([-appwindow.side,-appwindow.side]);
            let rect=userwindow.getrect();
            appwindow.setSize([rect[2],rect[3]-30]);
        });
        navbar.add_item(big,'right');
        let close=ctrlButton('×',function(event){userwindow.close(appwindow);});
        navbar.add_item(close,'right');
        //-------------------------------------------------------------------------視窗body
        let contentFrame=new Frame(this,[0,30],[rect[2],rect[3]-30],{'background-color':'black'});
        let content=new Panel(contentFrame,[0,0],['100%','100%'],{'background-color':'transparent','overflow':'auto'});
        //this.addEvent('resize',function(size){content.setSize(size);});
        this.content=content;
        //-----調整大小時，一併調整 控制列 與 body
        this.addEvent('resize',function(size){
            navbar.setWidth(size[0]);
            content.setSize([size[0],size[1]-30]);
        });
        //-----------------------------------------------視窗風格
        this.setStyle({'box-shadow':'0 4px 8px rgba(0, 0, 0, 0.2)','border-radius': '10px'});
        //--------------------------------------------------------------------------工作按鈕

    }
    getLayer(){
        return parseInt(this.container._style['z-index']);
    }
}
class AppWorkbtn{}