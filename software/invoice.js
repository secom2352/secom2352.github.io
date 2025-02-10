import { html_img,isASCII,copy_dict, convert_string, getabsrect, round, defaultDict} from "../webComponents/tool.js";
//------------------------------------------------------------------------------ui
import { body, Button, ContextMenu, defaultStyle, DropdownButton, getRelPos, Label, Panel, ScrollInput, SwitchButton, voidPanel } from "../webComponents/ui/base.js";
import { ExtendBar } from "../webComponents/ui/extendbar.js";
import { DragObj, NavBar, Tube, widget } from "../webComponents/ui/widget.js";
//------------------------------------------------------------------------------textctrl
import { TControl } from "../webComponents/textctrl/tcontrol.js";
import { TElement,Char,Image, TElementRegistry} from "../webComponents/textctrl/telement.js";
import { DemoModel, InputTextBox, RectModel, TModel,Table} from "../webComponents/textctrl/tmodel.js";


class FileList{
    constructor(parent,tctrl,pos,size){
        let extendbar=new ExtendBar(parent,pos,size);
        this.tctrl=tctrl;
        let fl=this;
        function savefile(bar){               //存檔
            console.log('儲存');
            bar.data=tctrl.ToString();
        }
        function loadfile(event,bar){          //載入檔案
            let code=bar.data;
            if(code!='') tctrl.LoadString(code);
            else newfile(bar);
        }
        function newfile(bar){               //建立新檔案
            tctrl.clear();
            bar.data=tctrl.ToString();
        }
        extendbar.hide_label();
        extendbar.add_folder('模板',loadfile,savefile);
        //extendbar.set_addfolder_btn('模板');
        //extendbar.set_addfile_btn('模板',newfile);
        extendbar.set_btn('模板','bill_plus',function(event){
            if(extendbar.folderpath=='') extendbar.folderpath='模板';
            extendbar.set_addfile_btn('',newfile,true);
            //let file=extendbar.getbar();
            //tctrl.clear();
            //file.data=tctrl.ToString();
        });
        //extendbar.set_download_btn('模板');
        //extendbar.set_content_color('模板','#aaaaaa');
        extendbar.add_folder('example');
        //extendbar.add_bar('模板',loadfile,'folder',newfile);
        //extendbar.add_bar('模板/newfile',loadfile,'file');
        //this.database={'模板/newfile':tctrl.ToString()};
        //extendbar.expand('模板');
        this.extendbar=extendbar;
        //this.nowpath='';     //當前檔案路徑
        //this.add_example();
    }
    add_folder(folderpath){
        this.extendbar.add_folder(folderpath);
    }
    newfile(path){
        this.tctrl.clear();
        this.database[path]=this.tctrl.ToString();
        this.nowpath=path;
        
    }
    loadfile(event,bar){
        if(this.nowpath!=''){
            this.database[this.nowpath]=this.tctrl.ToString()
        }
        let code=this.database[path];
        this.tctrl.LoadString(code);
        this.nowpath=path;
    }
    async load_example(url){
        fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.arrayBuffer(); // 將回應解析為 ArrayBuffer
      })
      .then(buffer => {
        const decoder = new TextDecoder('utf-8'); // 使用 UTF-8 解碼器
        const text = decoder.decode(buffer);
        this.tctrl.LoadString(text);
      });
    }
    //載入檔案列表內容
    load(filetext){
        this.database=DString_to_Dict(filetext);
    }
    save(){
        return Dict_to_DString(this.database);
    }
}
//-----------------------------------------------------------------------------------------------
export function Invoice(api=null,params=null){
    //=============================================================================  母面板
    let panel;
    if(api!=null){let appwindow=api('new window');panel=appwindow.content;
    }else panel=new Panel(body,[0,0],['100%','100%'],{'background-color':'transparent','overflow':'auto'});
    //==============================================================================  NavBar
    let nav=new NavBar(panel,0,{'background-color':'black','position':'fixed'});
    //-----------------------檔案欄
    let flist_switch=new SwitchButton(-1,html_img('list-ul2',[18,18]),
      function (event){Tfilelist.setX('0%');Tspace.setX('20%');Tspace.setWidth('80%');},
      function(event){Tfilelist.setX('-20%');Tspace.setX('0%');Tspace.setWidth('100%');},
      {'background-color':'red'},null,null,{'background-color':'transparent','padding':'10px 10px','border':'0px'})
    flist_switch.setSwitch(true);
    nav.add_item(flist_switch);
    //-------------------------專案按鈕
    let ddb_style={'background-color':'transparent','color':'white','font-size':'16px','padding':'10px 5px','border':'0px'};
    let project_btn=new DropdownButton(-1,'專案',{'background-color':'white','color':'black'},null,null,ddb_style);
    project_btn.setMainMenu([
        ['開新檔案',function (event){tctrl.clear();}],
        ['開啟存檔',function (event){tctrl.loadFile();}],
        ['儲存檔案',function (event){tctrl.saveFile();}],'hr',
        //['版面設定',function (event){}]
    ]);
    nav.add_item(project_btn,'left');
    //--------------------------頁面縮放
    nav.add_item(widget('button',[-1,'預覽',function (event){
        
        },null,null,{'color':'white','font-size':'16px','padding':'10px 10px','border':'0px'}],
        {'hover':[{'background-color':'green'}]}
    ),'right');
    //--------------------------格式匯出
    nav.add_item(widget('button',[-1,'格式匯出&ensp;',function (event){
        let code=tctrl.mtmodel.to_eps_middle();navigator.clipboard.writeText(code);alert('已複製:\n'+code);
        },null,null,{'background-color':'transparent','color':'white','font-size':'16px','padding':'10px 20px','border':'0px'}],
        {'hover':[{'background-color':'white','color':'black'}]}
    ),'right');
    let navh=nav.size[1];
    //============================================================================分割面板
    let prect=panel.getrect();
    let contenth=prect[3]-navh;
    let Tfilelist=new Panel(panel,['0%',navh],['20%',contenth],{'position':'fixed','background-color':'#666666'});
    let Tspace=new Panel(panel,['20%',navh],['80%',contenth],{'background-color':'#aaaaaa','overflow':'auto'});
    panel.addEvent('resize',function(size){Tspace.setHeight(size[1]-navh);Tfilelist.setHeight(size[1]-navh);});
    //============================================================================面板物件
    let tctrl=new CTControl(Tspace);
    tctrl.inputText('這是內容------123\n第二行的內容');
    //tctrl.setAlign('center');
    let filelist=new FileList(Tfilelist,tctrl,[0,0],['100%','90%']);
    //====================================================================操作按鈕
    {
        let dragTube=new Tube(panel,5,'hr',null,null,{'background-color':'black','position':'fixed'});
        let dragSpace=new DragObj(-1,null,[30,30],{'background-color':'#555555'});
        dragTube.add_item(voidPanel([0,30]));dragTube.add_item(dragSpace);
        dragSpace.bind(dragTube);
        //-------------------------------------------------------------系統變數
        let now_var=0;
        function insert_var_image(src,w,h,dtype){
            let bdict={'type':'varimage','src':src,'scale':w+','+h,'key':now_var,'dtype':dtype}
            now_var++;
            tctrl.tmodel.insert_varimage(bdict);
            //tctrl.insert_text(key,{'var':key})
        }
        let system_vars=new DropdownButton(-1,'系統工具',{'background-color':'#555555'},null,null,ddb_style);
        system_vars.setMainMenu([
            ['圖形',function (event){}],
            ['循環模板',function(event){
                let tmodel=tctrl.nowtmodel;
                let tblock=tctrl.nowtblock;
                let forloop=new ForLoop(tblock);
                tblock.addObj(forloop);
                tblock.arrange();
            }]
        ]);
        dragTube.add_item(system_vars);
        //-------------------------------------------------------------一般變數
        function insert_var(key=null){
            if(key==null){key=now_var;now_var++;}
            tctrl.inputTElements(new VarName(tctrl.nowtblock,{'varname':key+''}));
        }
        let common_var=new DropdownButton(-1,'插入變數',{'background-color':'#555555'},null,null,ddb_style);
        common_var.setMainMenu([
            ['插入變數',function (event){insert_var();}],
            ['插入代碼行',function (event){tctrl.nowtmodel.insertCodeLine();}],
            ['條碼',function (event){insert_var_image('image/barcode.png',172,70,'barcode');}],
            ['QR code',function (event){insert_var_image('image/hello_world.png',200,200,'QR code')}]
        ]);
        dragTube.add_item(common_var);
        //-------------------------------------------------------------對齊
        let absize=[16,16];
        let align_btn=new DropdownButton(-1,html_img('paragraph2',absize),{'background-color':'#555555'},null,null,ddb_style);
        align_btn.setMainMenu([
            [html_img('text-left',absize),function (event){tctrl.setAlign('left');}],
            [html_img('text-center',absize),function (event){tctrl.setAlign('center');}],
            [html_img('text-right',absize),function (event){tctrl.setAlign('right');}],
            [html_img('align-left',absize),function (event){tctrl.setAlign('left','auto');}],
            [html_img('align-center',absize),function (event){tctrl.setAlign('center','auto');}],
            [html_img('align-right',absize),function (event){tctrl.setAlign('right','auto');}],
        ]);
        dragTube.add_item(align_btn);
        //--------------------------------------------------------------
        dragTube.add_item(voidPanel([0,30]));
        dragTube.setPos([Tspace.pos[0]+5,Tspace.pos[1]+5]);
    }
    flist_switch.setSwitch(false,0);
}

class CTControl extends TControl{
    constructor(parent,_style=null){
        //加上padding後，自身大小為778
        super(parent,CTModel,[0,60],[768,'auto'],_style);
        this.fitTspace();
        let ctctrl=this;
        parent.addEvent('resize',function(size){ctctrl.fitTspace();});
    }
    fitTspace(){
        let paddingX=this.mtmodel.padding[0];
        this.setX(Math.max((this.parent.size[0]-768-paddingX*2)/2,0));
    }
}
class ForLoop extends TElement{
    constructor(tblock,bdict=null){
        if(bdict==null) bdict={};
        super(tblock,bdict);
        let size=[tblock.tmodel.size[0],200];
        this.size=size;
        //-------------------------------------------------------建構輸入方塊
        let forloop=this;
        this.loopItem=new VarModel(tblock.tcontrol,null,[100,50]);
        this.loopArray=new VarModel(tblock.tcontrol,null,[150,50]);

        let template=new CTModel(tblock.tcontrol,null,[size[0],size[1]-80]);
        template.addEvent('resize',(size)=>{
            forloop.size=[template.size[0]+20,template.size[1]+80];
            tblock.arrange();
        });
        this.template=template;
        this.font=tblock.tmodel.getTextFont(40,'Fira Code');
        //-------------------------------------------------------載入資料
        if(bdict['loopItem']) this.loopItem.nowtblock.LoadTeString(bdict['loopItem']);
        if(bdict['loopArray']) this.loopArray.nowtblock.LoadTeString(bdict['loopArray']);
        if(bdict['template']) this.template.nowtblock.LoadTeString(bdict['template']);
        this.addEvent('destroy',()=>{
            forloop.loopItem.destroy();
            forloop.loopArray.destroy();
            forloop.template.destroy();
        })
    }
    select(is_selected){
        super.select(is_selected);
        this.loopArray.select(is_selected);
        this.loopItem.select(is_selected);
        this.template.select(is_selected);
    }
    render(){
        let tmodel=this.tmodel;
        this.pos[0]=0;             //與模板並行
        let rect=this.getrect();
        //-------------------------------------背景色
        if(this.is_selected) tmodel.drawRect(rect,'lightblue');
        else tmodel.drawRect(rect,'black');
        tmodel.setTextStyle(this.font,'white');
        tmodel.drawText('ForLoop',[rect[0]+10,rect[1]+40]);
        tmodel.drawText('in',[rect[0]+300,rect[1]+40]);
        //-------------------------------------------------------------定位輸入框
        let relPos=getRelPos(this.tmodel.tcontrol,this.tmodel);
        this.loopItem.setPos([relPos[0]+this.pos[0]+180,relPos[1]+this.pos[1]+7]);
        this.loopArray.setPos([relPos[0]+this.pos[0]+360,relPos[1]+this.pos[1]+7]);
        this.template.setPos([relPos[0]+this.pos[0],relPos[1]+this.pos[1]+70]);
    }
    getDict(){
        this.bdict['loopItem']=this.loopItem.nowtblock.ToTeString();
        this.bdict['loopArray']=this.loopArray.nowtblock.ToTeString();
        this.bdict['template']=this.template.nowtblock.ToTeString();
        return this.bdict;
    }
}

class EpCode extends Char{   //------------------------------------------------------------------- 文字
    constructor(tblock,bdict){
        bdict=defaultDict(bdict,{'fontHeight':'48','fontFamily':'新細明體'});
        super(tblock,bdict);
        if(isASCII(this.bdict['char'])) this.size[0]=24;
        else this.size[0]=48;
        this.bdict['type']='epcode';
        this.type='epcode';
    }
}
class VarModel extends RectModel{
    constructor(tcontrol,pos,size,_style=null){
        _style=defaultStyle(_style,{'background':'yellow'});
        super(tcontrol,pos,size,_style);
        let vm=this;
        this.nowtblock.addInputMethod('char',(char)=>{
            return new Char(vm.nowtblock,{'char':char,
                'fontFamily':'Fira Code','fontHeight':'48','color':'red'});
        },true);
        this.nowtblock.lineHeight=48;
        this.nowtblock.enableChangeLine=false;
        this.setPadding([1,1]);
    }
}

class VarName extends InputTextBox{
    constructor(tblock,bdict=null){
        bdict=defaultDict(bdict,{
            'text':bdict['varname'],                                             //預設文字內容
            'fontFamily':'Fira Code','fontHeight':'48','color':'red',            //文字屬性
            'bgcolor':'yellow','size':'100,48','lineHeight':'48','padding':'5,0'  //輸入框
        });
        super(tblock,bdict);
    }
}
class CodeLine extends InputTextBox{
    constructor(tblock,bdict=null){
        bdict=defaultDict(bdict,{
            'fontFamily':'Fira Code','fontHeight':'48','color':'white',
            'bgcolor':'black','size':'180,52','lineHeight':'48','padding':'5,2',
            'inpcolor':'white'
        });
        super(tblock,bdict);
    }
}

class VarImage extends Image{
    constructor(tmodel,bdict){
        super(tmodel,bdict);
        this.bdict['type']='varimage';
        this.type='varimage';
    }
    onload(){
        super.onload();
        this.element.insertAdjacentHTML('beforeend',
        `<span style="position:absolute;top:0px;left:0px;background-color:yellow;font-size:70px;">${this.bdict['key']}</span>`);
    }
}
class CTModel extends DemoModel{
    constructor(tcontrol,pos,size,_style=null){
        super(tcontrol,pos,size,_style=null);
        this.setPadding([5,5]);
        this.nowtblock.lineHeight=48;
        let tmodel=this;
        //--------------------------------------新增輸入模式
        this.nowtblock.addInputMethod('epcode',(char)=>{return new EpCode(tmodel.nowtblock,{'char':char});},true);
        this.fontA=[24,48];
        this.fontB=[18,34];
    }
    insertCodeLine(){
        this.nowtblock.inputTElements(new CodeLine(this.nowtblock));
    }
    //插入系統變數
    insert_system_variable(stype,key,mdict){}
    to_eps_middle(){
        return this.nowtblock.ToTeString();
    }
}

TElementRegistry['epcode']=[EpCode,'char'];
TElementRegistry['varname']=[VarName,null];
TElementRegistry['codeline']=[CodeLine,null];
TElementRegistry['forloop']=[ForLoop,null];