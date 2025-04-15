import { html_img,isASCII, defaultDict, fillMissingKeys, NumberArray, copyDict} from "../webComponents/tool.js";
//------------------------------------------------------------------------------ui
import { body, Button, defaultStyle, DropdownButton, getRelPos, Label, Panel, ScrollInput, Select, SwitchButton, voidPanel } from "../webComponents/ui/base.js";
import { ExtendBar } from "../webComponents/ui/extendbar.js";
import { DragObj, NavBar, Tube, widget } from "../webComponents/ui/widget.js";
//------------------------------------------------------------------------------textctrl
import { TControl } from "../webComponents/textctrl/tcontrol.js";
import { TElement,Char,Image, TElementRegistry, HrLine} from "../webComponents/textctrl/telement.js";
import { DemoModel, RectIBox, RectTextModel,TModelTElement} from "../webComponents/textctrl/tmodel.js";


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
        ['儲存檔案',function (event){tctrl.saveFile('invoice.txt');}],//'hr',
        ['版寬&ensp;&ensp;▶','invoice_width'],
        ['縮放&ensp;&ensp;▶','invoice_zoom']
    ]);
    project_btn.addMenu(1,'invoice_width',[
        ['57mm',(event)=>{tctrl.setEscWidth(57)}],
        ['80mm',(event)=>{tctrl.setEscWidth(80)}],
    ]);
    function setInvoiceZoom(zoom){
        tctrl.zoom(zoom);
    }
    project_btn.addMenu(1,'invoice_zoom',[
        ['1.0x',(event)=>{setInvoiceZoom(1)}],
        ['1.5x',(event)=>{setInvoiceZoom(1.5)}],
        ['2.0x',(event)=>{setInvoiceZoom(2)}],
        ['2.5x',(event)=>{setInvoiceZoom(2.5)}],
        ['實際',(event)=>{setInvoiceZoom(1/tctrl.mtmodel.devicePixelRatio*0.8);}],
        ['自訂',(event)=>{
            let v=prompt('自訂縮放',tctrl.zoomRate+'');
            if (!isNaN(v))
                setInvoiceZoom(parseFloat(v))
        }],
    ]);
    nav.add_item(project_btn,'left');
    //--------------------------頁面縮放
    nav.add_item(widget('button',[-1,'預覽',function (event){
            console.log('tctrl size:',tctrl.size);
        },null,null,{'color':'white','font-size':'16px','padding':'10px 10px','border':'0px'}],
        {'hover':[{'background-color':'green'}]}
    ),'right');
    //--------------------------格式匯出
    nav.add_item(widget('button',[-1,'格式匯出&ensp;',function (event){
        let code=tctrl.ToTcString();navigator.clipboard.writeText(code);alert('已複製:\n'+code);
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
    //tctrl.inputText('這是內容------123\n第二行的內容\nabcdefghijklmnopqrstuvwxyz');
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
            let bdict={'type':'varimage','size':w+','+h,'varname':now_var,'codeType':dtype}
            now_var++;
            tctrl.insertImage(src,bdict);
            //tctrl.insert_text(key,{'var':key})
        }
        let system_vars=new DropdownButton(-1,'系統工具',{'background-color':'#555555'},null,null,ddb_style);
        system_vars.setMainMenu([
            ['循環模板',function(event){
                let tblock=tctrl.nowtblock;
                tblock.changeLine();
                tblock.addObj({'type':'forloop'});
                tblock.changeLine();
                tblock.arrange();
            }],
            ['限制區塊',function (event){
                let tblock=tctrl.nowtblock;
                let limitblock=tblock.addObj({'type':'limitblock'});tblock.arrange();
                tctrl.tetfr.transformTElement(limitblock);
            }],
            //['時間格式',function (event){}],
            ['圖形&ensp;&ensp;▶','graphics'],
            ['裁切&ensp;&ensp;▶','cut_invoice'],
        ]);
        system_vars.addMenu(1,'graphics',[
            ['文字虛線',function(event){tctrl.inputText('----------');}],
            ['水平線(細)',function(event){tctrl.setHrLine(1);}],
            ['水平線(中)',function(event){tctrl.setHrLine(2);}],
            ['水平線(粗)',function(event){tctrl.setHrLine(4);}],
        ]);
        function inputCutLine(cutType){
            let tblock=tctrl.nowtblock;tblock.changeLine();
            tblock.addObj({'type':'cutline','cutType':cutType});
            tblock.changeLine();tblock.arrange();
        }
        system_vars.addMenu(1,'cut_invoice',[
            ['半裁切',function(event){inputCutLine('halfcut')}],
            ['全切',function(event){inputCutLine('cut');}],
        ]);
        dragTube.add_item(system_vars);
        //-------------------------------------------------------------一般變數
        function insert_var(key=null){
            if(key==null){key=now_var;now_var++;}
            tctrl.inputTElements({'type':'varname','varname':key+''});
            //tctrl.nowtblock.arrange();
            //tctrl.renderData();
        }
        let common_var=new DropdownButton(-1,'插入變數',{'background-color':'#555555'},null,null,ddb_style);
        common_var.setMainMenu([
            ['變數',function (event){insert_var();}],
            //['插入代碼行',function (event){tctrl.nowtmodel.insertCodeLine();}],
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
    flist_switch.enable(false);
}

class CTControl extends TControl{
    constructor(parent,_style=null){
        //加上padding後，自身大小為778
        _style=defaultStyle(_style,{'min-height':'200px'});
        super(parent,CTModel,{'padding':'5,5'},[0,60],[394,'auto'],_style);
        this.padding=this.mtmodel.padding;
        //---------------------------基本參數
        this.esc_width=57;
        this.display_width=768;
        //---------------------------
        this.fitTspace();
        let ctctrl=this;
        parent.addEvent('resize',function(size){
            ctctrl.fitTspace();});
    }
    zoom(zoom){
        super.zoom(zoom);
        this.fitTspace();
    }
    setEscWidth(esc_width){
        this.esc_width=esc_width;
        this.display_width={57:384,80:576}[esc_width];
        let width=this.display_width+this.padding[0]*2;
        this.mtmodel.nowtblock.setBlock([this.padding[0],this.padding[1],
            this.display_width,this.mtmodel.size[1]-this.padding[1]*2]);
        this.setWidth(width);
        this.fitTspace();
    }
    fitTspace(){
        this.setX(Math.max((this.parent.size[0]-this.size[0])/2,0));
        this.nowtblock.arrange();
    }
    //--------------------------------------------------儲存格式
    getDict(){
        let tcDict=super.getDict();
        tcDict['escWidth']=this.esc_width+'';
        return tcDict;
    }
    loadDict(tcDict){
        this.setEscWidth(parseInt(tcDict['escWidth']));
        this.clear();
        this.mtmodel.LoadTmString(tcDict['mtmodel']);
    }
}
class LimitBlock extends RectIBox{
    constructor(tblock,bdict=null){
        super(tblock,bdict,CTModel);
        this.tmObj.setStyle({'border':'1px black dashed'});
        this.nowtblock.allowInputTypes=['epcode','image','br','align','varname','varimage'];
        if(bdict['content']) this.tmObj.LoadTmString(bdict['content']);
    }
    getDict(){
        let _dict=super.getDict();
        _dict['content']=this.tmObj.ToTmString();
        return _dict;
    }
}
class CutLine extends HrLine{
    constructor(tblock,bdict=null){
        bdict=defaultDict(bdict,{'cutType':'cut','lineHeight':'3'});
        super(tblock,bdict);
    }
    getDisplayRect(){
        return [0,this.pos[1],this.tmodel.size[0],this.size[1]];
    }
    render(){
        let tmodel=this.tmodel;
        if(this.is_selected)
            tmodel.drawRect(this.getDisplayRect(),'lightblue');
        let lineHeight=parseInt(this.bdict['lineHeight']);
        let y=this.pos[1]+(this.size[1]-lineHeight)/2;
        let rect=this.getDisplayRect();
        if(this.bdict['cutType']=='halfcut')
            tmodel.drawLine([0,y],[this.tmodel.size[0],y],'red',lineHeight,[15,5]);
        else
            tmodel.drawLine([0,y],[this.tmodel.size[0],y],'red',lineHeight);
    }
}
class ForLoop extends TElement{
    constructor(tblock,bdict=null){
        if(bdict==null) bdict={};
        super(tblock,bdict);
        let size=[tblock.tmodel.getInnerWidth(),200];
        this.size=size;
        //-------------------------------------------------------建構輸入方塊
        let forloop=this;
        this.loopItem=new VarModel(tblock.tcontrol,null,null,[100,25]);
        this.loopArray=new VarModel(tblock.tcontrol,null,null,[100,25]);

        let template=new CTModel(tblock.tcontrol,null,null,[tblock.tmodel.size[0],size[1]-40]);
        tblock.addEvent('setblock',(block)=>{    //跟隨母 tblock 變更大小
            let tpBlock=template.nowtblock.getBlock();
            if(block[2]!=tpBlock[2])
                template.nowtblock.setBlock([tpBlock[0],tpBlock[1],block[2],tpBlock[3]]);
            forloop.size=[template.getInnerWidth(),template.size[1]+40];
        });
        this.template=template;
        this.font=tblock.tmodel.getFontkey(20,'Fira Code');
        //-------------------------------------------------------載入資料
        if(bdict['loopItem']) this.loopItem.inputText(bdict['loopItem']);
        if(bdict['loopArray']) this.loopArray.inputText(bdict['loopArray']);
        if(bdict['template']) {
            this.template.LoadTmString(bdict['template']);
        }
        this.addEvent('destroy',()=>{
            forloop.loopItem.destroy();
            forloop.loopArray.destroy();
            forloop.template.destroy();
        });
    }
    select(is_selected){
        super.select(is_selected);
        this.loopArray.select(is_selected);
        this.loopItem.select(is_selected);
        this.template.select(is_selected);
    }
    setPos(pos){
        super.setPos(pos);
        let rect=this.getDisplayRect();
        //-------------------------------------------------------------定位輸入框
        let relPos=getRelPos(this.tmodel.tcontrol,this.tmodel);
        this.loopItem.setPos([relPos[0]+90,relPos[1]+rect[1]+3]);
        this.loopArray.setPos([relPos[0]+230,relPos[1]+rect[1]+3]);
        this.template.setPos([relPos[0],relPos[1]+rect[1]+32]);
        //this.template.nowtblock.arrange(false);
    }
    render(){
        let tmodel=this.tmodel;
        //this.pos[0]=0;             //與模板並行
        let rect=this.getDisplayRect();
        //-------------------------------------背景色
        if(this.is_selected) tmodel.drawRect(rect,'lightblue');
        else tmodel.drawRect(rect,'black');
        tmodel.setTextStyle(this.font,'white');
        tmodel.drawText('ForLoop',[rect[0]+5,rect[1]+20]);
        tmodel.drawText('in',[rect[0]+200,rect[1]+20]);
        this.template.renderData();        
    }
    getDisplayRect(){
        return [0,this.pos[1],this.tmodel.size[0],this.size[1]];
    }
    getDict(){
        this.bdict['loopItem']=this.loopItem.getVarName();
        this.bdict['loopArray']=this.loopArray.getVarName();
        this.bdict['template']=this.template.ToTmString();
        return this.bdict;
    }
}

class EpCode extends Char{   //------------------------------------------------------------------- 文字
    constructor(tblock,bdict){
        bdict=defaultDict(bdict,{'fontHeight':'24','fontFamily':'新細明體'});
        super(tblock,bdict);
        this.adjustCharSize();
    }
    adjustCharSize(){
        if(isASCII(this.char)) this.size[0]=this.fontHeight/2*this.scale[0];
        else this.size[0]=this.fontHeight*this.scale[0];
    }
    transformup(){
        let scale=NumberArray(this.bdict['scale']).map((value)=>Math.min(Math.max(Math.floor(value),1),7));
        this.setDict({'scale':scale[0]+','+scale[1]});
        this.adjustCharSize();
    }
}
class VarModel extends RectTextModel{  //     單行文字輸入框
    constructor(tcontrol,mdict=null,pos=null,size=null,_style=null){
        mdict=fillMissingKeys(mdict,{'background':'yellow',
            'lineSpace':'0',
            'lineHeight':'24',
            'allowInputTypes':'epcode',
            'allowOverWidth':'0',
            'allowOverHeight':'0',
            'allowChangeLine':'0',
            'autoFitSize':'0',
            'padding':'2,2',
        });
        super(tcontrol,mdict,pos,size,_style);
        this.nowtblock.addInputMethod('epcode',(char)=>{
            return {'type':'epcode','char':char,'fontFamily':'Fira Code','color':'red'};
        },true);
    }
    getVarName(){
        return this.getText('epcode','char');
    }
}

class VarName extends TModelTElement{
    constructor(tblock,bdict=null){
        bdict=defaultDict(bdict,{'size':'10,24',
            'allowOverWidth':'1',
            'allowOverHeight':'0',
            'allowChangeLine':'0',
            'autoFitSize':'1',
            'padding':'5,0',
            //-------------------------文字屬性
            'scale':'1,1',
            'B':'0',
            'U':'0',
            'fontHeight':'24',
        });
        bdict['size']='10,24';  //重置尺寸
        super(tblock,bdict,VarModel,false);
        if(bdict['varname']){
            this.nowtblock.inputText(bdict['varname']);
            let textDict={'scale':this.bdict['scale'],
                          'B':this.bdict['B'],
                          'U':this.bdict['U'],
                          'fontHeight':this.bdict['fontHeight']
            };
            this.updateByFunc((teObj)=>{
                teObj.setDict(textDict);
            });
            this.nowtblock.arrange(false);
        }
    }
    getVarName(){
        return this.tmObj.getVarName();
    }
    getDict(){
        let _dict=super.getDict();
        _dict['varname']=this.getVarName();
        //------------------------------------
        let relObjs=this.nowtblock.relObjs;
        if(relObjs.length>0){
            let textDict=relObjs[0].getDict();
            _dict['scale']=textDict['scale'];
            _dict['B']=textDict['B'],
            _dict['U']=textDict['U'],
            _dict['fontHeight']=textDict['fontHeight'];
        }
        return _dict;
    }
    updateByFunc(updateFunc){
        let relObjs=this.nowtblock.relObjs;
        for(let i=0;i<relObjs.length;i++){
            relObjs[i].updateByFunc(updateFunc);
        }
        this.nowtblock.arrange(false);
    }
}
class CodeLine extends TModelTElement{
    constructor(tblock,bdict=null){
        bdict=defaultDict(bdict,{
            'fontFamily':'Fira Code','fontHeight':'24','color':'white',
            'bgcolor':'black','size':'180,52','lineHeight':'24','padding':'5,2',
            'inpcolor':'white'
        });
        super(tblock,bdict);
    }
}

class VarImage extends TElement{
    constructor(tblock,bdict){
        let size=null;
        if(bdict['size']) size=NumberArray(bdict['size']);
        super(tblock,{'codeType':bdict['codeType']});   //自身只取 codeType
        let vi=this;
        this.teImage=new Image(tblock,bdict);
        this.teImage.addEvent('onload',()=>{
            if(size==null)
                vi.setSize(vi.teImage.size);
            else vi.setSize(size);
            //console.log('載入後大小:',vi.teImage.size);
        });
        this.varName=new VarName(tblock,{
            'varname':bdict['varname']+'',
            'size':'10,24',
            'allowOverWidth':'1',
            'allowOverHeight':'0',
            'allowChangeLine':'0',
            'autoFitSize':'1',
            'padding':'5,0'
        });
        this.varName.addEvent('resize',(size)=>{
            vi.setSize([Math.max(vi.size[0],size[0]),Math.max(vi.size[1],size[1])]);
        });
        this.addEvent('destroy',()=>{
            this.teImage.destroy();
            this.varName.destroy();
        });
    }
    select(is_selected){
        this.teImage.select(is_selected);
        this.varName.select(is_selected);
    }
    setPos(pos){
        super.setPos(pos);
        this.teImage.setPos(pos);
        this.varName.setPos([pos[0],pos[1]+this.teImage.size[1]-this.varName.size[1]]);
    }
    setSize(size){
        size=[Math.max(this.varName.size[0],size[0]),Math.max(this.varName.size[1],size[1])];
        this.bdict['size']=size[0]+','+size[1];
        super.setSize(size);
        this.teImage.setSize(size);
    }
    transform(transformDict){
        if(this.bdict['codeType']=='QR code'){
            let size=transformDict['size'];
            let offsetSize=[size[0]-this.size[0],size[1]-this.size[1]];
            if(offsetSize[0]!=0) size[1]=size[0];
            else size[0]=size[1];
            let maxWidth=this.tblock.getLineWidth(this.pos);
            if(size[0]>maxWidth) size=[maxWidth,maxWidth];
            this.setSize(size);
        }else super.transform(transformDict);
    }
    render(){
        this.teImage.render();
        this.varName.render();
    }
    getDict(){
        let bdict=this.teImage.getDict();
        bdict['type']='varimage';
        bdict['varname']=this.varName.getVarName();
        bdict['codeType']=this.bdict['codeType'];
        return bdict;
    }
}
class CTModel extends DemoModel{
    constructor(tcontrol,mdict,pos,size,_style=null){
        mdict=fillMissingKeys(mdict,{
            'padding':'5,5',
            'lineHeight':'24'
        });
        super(tcontrol,mdict,pos,size,_style=null);
        //--------------------------------------新增輸入模式
        this.nowtblock.addInputMethod('epcode',(char)=>{return {'type':'epcode','char':char};},true);
        this.fontA=[12,24];
        this.fontB=[9,17];
        //--------------------------------------tblock 事件
        let tblock=this.nowtblock;
        //--------------------------------------- 屬性變更框
        tcontrol.newSelectionBox('epcode',['epcode','varname'],[
            ['label','w:',[5,5]],
            ['select',[1,2,3,4,5,6,7],[28,5],(teObj)=>{return teObj.scale[0];},(teObj,value)=>{
                teObj.setDict({'scale':value+','+teObj.scale[1]});
            }],['label','h:',[72,5]],
            ['select',[1,2,3,4,5,6,7],[90,5],(teObj)=>{return teObj.scale[1];},(teObj,value)=>{
                teObj.setDict({'scale':teObj.scale[0]+','+value});
            }],['btn','<b>B</b>',[5,33],(teObj)=>{return teObj.bdict['B']=='1';},(teObj,value)=>{
                teObj.setDict({'B':value?'1':'0'});
            }],
            ['btn','<u>U</u>',[30,33],(teObj)=>{return teObj.bdict['U']=='1';},(teObj,value)=>{
                teObj.setDict({'U':value?'1':'0'});
            }],
            ['select',['Font A','Font B'],[60,35],(teObj)=>{return teObj.fontHeight==24?'Font A':'Font B';},(teObj,value)=>{
                teObj.setDict({'fontHeight':value=='FontA'?'24':'17'});
            }],
        ],[125,60]);
        //tblock.setSelectionBox('epcode');
        tblock.addEvent('selectup',(event)=>{
            let index=tblock.selecting[1]-1;
            if(tblock.selecting[0]>tblock.selecting[1]) index=tblock.selecting[1];
            console.log('index:',index);
            console.log('length:',tblock.relObjs.length);
            tcontrol.showSelectionBox('epcode',tblock.relObjs[index]);
        });
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
Object.assign(TElementRegistry,{
    'epcode':[EpCode,'char'],
    'varname':[VarName,null],
    'codeline':[CodeLine,null],
    'limitblock':[LimitBlock,null],
    'cutline':[CutLine,null],
    'forloop':[ForLoop,null],
    'varimage':[VarImage,'src']
});