import { Canvas, defaultStyle, getRelPos } from "../ui/base.js";
import { TElement,Char, TElementRegistry } from "./telement.js";
import { TBlock } from "./tblock.js";
import { Modal } from "../ui/widget.js";
import { defaultDict, Dict_to_DString, DString_to_Dict, fetchDict, fillMissingKeys, List_to_LString, LString_to_List, NumberArray } from "../tool.js";

export class TModel extends Canvas{         //這是任意形狀的 TModel
    constructor(tcontrol,mdict=null,pos=null,size,_style=null){
        mdict=fillMissingKeys(mdict,{'background':'white'});
        _style=defaultStyle(_style,{'background':mdict['background'],'cursor':'text'});
        super(tcontrol,pos,size,_style);
        this.tcontrol=tcontrol;
        this.mdict=mdict;
        //----------------------------------------------------------基本參數
        this.is_selected=false;              //是否被選擇
        this.tblocks=[];                     //所有 tblocks
        this.nowtblock=null;                 //目前 tblock
        //this.bgcolor='transparent';
        //----------------------------------------------------------登記 tmodel
        tcontrol.addTmodel(this);
        this.addEvent('destroy',()=>{
            for(let i=0;i<tmodel.tblocks.length;i++) tmodel.tblocks[i].destroy();
            tcontrol.removeTmodel(tmodel);});
        let tmodel=this;
        //---------------------------------------------------------- 滑鼠事件(視為真實點按)
        this.isFocus=false;       //是否存在 tblock 現在被 tcontrol focus 中
        function convertToRelPos(event){
            let apos=tmodel.getScreenPos();
            return [(event.clientX-apos[0])/tcontrol.zoomRate,(event.clientY-apos[1])/tcontrol.zoomRate];
        }
        this.addEvent('onmousedown',function (event){
            //if(event.button==0){
                tcontrol.hideAuxiliary();
                let relPos=convertToRelPos(event); //[鼠標]相對於[自身左上角]的 pos
                for(let i=0;i<tmodel.tblocks.length;i++){
                    if(tmodel.tblocks[i].onmousedown(relPos,event)!=null) tmodel.nowtblock=tmodel.tblocks[i];
                }
            //}
            tmodel.isFocus=tcontrol.nowtmodel==tmodel;
        });
        this.addEvent('ondblclick',function (event){
            let choosedTelement=null;
            let relPos=convertToRelPos(event);         //[鼠標]相對於[自身左上角]的 pos
            for(let i=0;i<tmodel.tblocks.length;i++){
                choosedTelement=tmodel.tblocks[i].tap(relPos,true);
            }
            if(choosedTelement!=null) {
                tcontrol.tetfr.transformTElement(choosedTelement);
            }
        })
        this.addEvent('contextmenu', function(event) {
            if(tmodel.rightclick_func!=null) tmodel.rightclick_func(event);
            tmodel.nowtblock.show_inp();
        });
        this.rightclick_func=null;
        //----------------------------------------------------------
        this.type='tmodel';
    }
    setDict(_mdict=null){
        if(_mdict!=null) Object.assign(this.mdict,_mdict);
        this.setStyle({'background':this.mdict['background']});
    }
    //=====================================================================================新增 擴充
    setRightClick(func){
        this.rightclick_func=func;
    }
    //===================================================================================== Tblock 事件
    addTBlock(block,lineHeight=30,lineSpace=6){
        this.tblocks.push(new TBlock(this,block,lineHeight,lineSpace));
    }
    select(is_selected=true){
        this.is_selected=is_selected;
        for(let i=0;i<this.tblocks.length;i++) this.tblocks[i].select(is_selected);
    }
    //=====================================================================================渲染 自身
    getDisplayRect(){                 //目前能看見的區域
        let apos=this.getScreenPos();
        let y=-apos[1]/this.tcontrol.zoomRate-200
        return [0,y,this.size[0],screen.height+1000];
    }
    setPos(pos){      //當自身座標被移動時，重新排列並渲染自身
        super.setPos(pos);
        //console.log('tmodel setPos');
        for(let i=0;i<this.tblocks.length;i++) this.tblocks[i].arrange(false);
        this.renderData();
    }
    renderData(rect=null){             //將自身儲存的資料結構(tblock內特定位置內容渲染出來)
        // 這個 rect 是讓自身內部 在此 rect 範圍內的物件顯示，該 rect 是原大小，不計入縮放
        //console.log('目前時間:',performance.now());
        let start=performance.now();
        this.setPixelDensity(this.devicePixelRatio*this.tcontrol.zoomRate);
        if(rect==null) rect=this.getDisplayRect();
        if(this.is_selected) this.drawRect(rect,'skyblue');
        else this.clearRect(rect);
        this.text_times=0;
        //console.log(`清空時間: ${(performance.now() - start).toFixed(3)}ms`);
        start=performance.now();
        for(let i=0;i<this.tblocks.length;i++){
            this.tblocks[i].render(rect);
        }
        //console.log('文字次數:',this.text_times);
        //console.log(`渲染時間: ${(performance.now() - start).toFixed(3)}ms`);
    }
    drawText(text,pos,maxWidth=null){
        super.drawText(text,pos,maxWidth);
        this.text_times++;
    }
    //=====================================================================================儲存 與 載入
    getDict(){
        //let teStringBox=[];
        //for(let i=0;i<this.tblocks.length;i++) teStringBox.push(this.tblocks[i].ToTeString());
        //this.mdict['tblocks']=List_to_LString(teStringBox);
        return this.mdict;
    }
    ToTmString(){
        //return Dict_to_DString(this.getDict());
    }
    LoadTmString(tmString){
        //this.mdict=DString_to_Dict(tmString);
        //this.setDict();
        //let teStringBox=LString_to_List(this.mdict['tblocks']);
        //for(let i=0;i<teStringBox.length;i++){
        //    this.tblocks[i].LoadTeString(teStringBox[i]);
        //    this.tblocks[i].arrange(false);
        //}
        //this.renderData();
    }
}
export class RectModel extends TModel{   //----------------------------------方形 TModel，只有一個 tblock
    constructor(tcontrol,mdict=null,pos=null,size=null,_style=null){
        mdict=fillMissingKeys(mdict,{
            'fontFamily':'Arial','fontHeight':'30','color':'black',            // 默認輸入 char 屬性
            'lineHeight':'30','inpcolor':'black','lineSpace':'6',              // 默認 tblock 輸入屬性
            //------------------------ tblock設定
            'allowInputTypes':'null',
            'allowOverWidth':'0',
            'allowOverHeight':'1',
            'allowChangeLine':'1',
            'autoFitSize':'1',
            //------------------------ 外觀
            'padding':'0,0',
        });
        super(tcontrol,mdict,pos,size,_style);
        let padding=NumberArray(mdict['padding']);
        let rectBlock=[padding[0],padding[1],this.size[0]-padding[0]*2,this.size[1]-padding[1]*2];
        this.addTBlock(rectBlock);
        this.nowtblock=this.tblocks[0];
        //------------------------------------------------------------------ 更新自身屬性
        this.setDict();
        this.nowtblock.addInputMethod('char',(char)=>{
            return {'char':char,'type':'char',
                'fontFamily':mdict['fontFamily'],'fontHeight':mdict['fontHeight'],'color':mdict['color']};
        },true);
        //------------------------------------------------------------------ 尺寸變更事件
        let tmodel=this;
        this.nowtblock.addEvent('setblock',(block)=>{
            tmodel.setSize([block[2]+tmodel.padding[0]*2,block[3]+tmodel.padding[1]*2]);
        });
    }
    setDict(_mdict=null){
        super.setDict(_mdict);
        let nowtblock=this.nowtblock;
        let mdict=this.mdict;
        //---------------------------------------------------預設 基本輸入型態
        nowtblock.lineHeight=parseInt(mdict['lineHeight']);
        nowtblock.lineSpace=parseInt(mdict['lineSpace']);
        nowtblock.inp_color=mdict['inpcolor'];
        //------------------------------------------------------------------設置 padding
        this.padding=NumberArray(mdict['padding']);
        //------------------------------------------------------------------ tblock 設定
        if(mdict['allowInputTypes']=='null') nowtblock.allowInputTypes=null;
        else nowtblock.allowInputTypes=mdict['allowInputTypes'].split(',');
        nowtblock.allowOverWidth=mdict['allowOverWidth']=='1';
        nowtblock.allowOverHeight=mdict['allowOverHeight']=='1';
        nowtblock.allowChangeLine=mdict['allowChangeLine']=='1';
        nowtblock.autoFitSize=mdict['autoFitSize']=='1';
    }
    getInnerWidth(){
        return this.nowtblock.getLineWidth(null);
    }
    getDict(){
        this.mdict['nowtblock']=this.nowtblock.ToTeString();
        return this.mdict;
    }
    ToTmString(){
        return Dict_to_DString(this.getDict());
    }
    LoadTmString(tmString){
        this.mdict=DString_to_Dict(tmString);
        this.setDict();
        let teString=this.mdict['nowtblock'];
        this.nowtblock.LoadTeString(teString);
        this.nowtblock.arrange(false);
        this.renderData();
    }
}
export class RectTextModel extends RectModel{   //-----------------------------方形[純文字]輸入框
    constructor(tcontrol,mdict=null,pos=null,size=null,_style=null){
        mdict=fillMissingKeys(mdict,{
            'allowInputTypes':'char',
        });
        super(tcontrol,mdict,pos,size,_style);
    }
    inputText(text){
        this.nowtblock.inputText(text);
        this.nowtblock.arrange();
    }
    getText(chartype='char',charkey='char'){
        return this.nowtblock.getText(chartype,charkey);
    }
}

export class DemoModel extends RectModel{       //一個用於展示各種 TModel 功能的物件
    constructor(tcontrol,mdict=null,pos=null,size=null,_style=null){
        super(tcontrol,mdict,pos,size,_style);
        let tmodel=this;
        tcontrol.addMenu(0,'demo_insert',[
            ['貼上',function (event){tmodel.nowtblock.paste();}],
            ['插入圖片',function (event){imgModal.launch();}],
            //['限制方塊',function (event){
            //    let iRectBox=tmodel.nowtblock.insertRectIBox();
            //    tmodel.nowtblock.arrange();
            //    tcontrol.tetfr.transformTElement(iRectBox);
            //}],
        //    ['插入表格',function (event){tmodel.insert_table(5,5);}],
        //    ['屬性&ensp;&ensp;▶','file']
        ]);
        let imgModal=new Modal(this,'插入圖片',['50%',300],function (){
            let img_path=textctrl_imgpath.value.replace('\\','/');
            if(img_path!='')
            tcontrol.nowtblock.insertImage(upload_src,{'dsrc':img_path});
        });
        imgModal.loadHTML(`<input placeholder="輸入圖片網址" style="width:90%;font-size:1rem;" id='textctrl_imgurl'><br/><br/><br/>
                            <input type="file" id='textctrl_imgupload'><br/><br/>
                            <label for="textctrl_imgpath">轉碼時讀取位址:</label><input id="textctrl_imgpath" style="font-size:1rem;">`)
        let textctrl_imgurl=document.getElementById('textctrl_imgurl');
        let textctrl_imgupload=document.getElementById('textctrl_imgupload');
        let textctrl_imgpath=document.getElementById('textctrl_imgpath');
        textctrl_imgurl.addEventListener('input',function (event){
            textctrl_imgpath.value=textctrl_imgurl.value;
            upload_src=textctrl_imgurl.value;
        });
        let upload_src='';
        textctrl_imgupload.addEventListener('change', function(event) {
            const file = event.target.files[0]; // 获取第一个上传的文件
            if (file) {
                textctrl_imgpath.value=file.name;
                const reader = new FileReader();
                reader.onload = function(e) {
                  const preview = document.getElementById('preview');
                  upload_src = e.target.result; // 将文件内容作为图像来源
                  preview.style.display = 'block'; // 显示图片
                };
                reader.readAsDataURL(file);
            }
        });
        textctrl_imgurl.value='https://allen2352.github.io/speed_test.jpg';
        textctrl_imgpath.value='https://allen2352.github.io/speed_test.jpg';
            upload_src='https://allen2352.github.io/speed_test.jpg';
        //---------------------------------------------------------------------
        tcontrol.addMenu(1,'file',[
            ['開新檔案',function (event){tcontrol.clear();}],
            ['開啟舊檔',function (event){tcontrol.loadfile();}],
            ['儲存檔案',function (event){tcontrol.savefile();}],
        ]);
        //----------------------------------------------------------------------------------
        tcontrol.addMenu(0,'revise',[
            ['複製',function (event){tcontrol.tmodel.copy(cm.selecting);}],
            ['剪下',function (event){tcontrol.tmodel.cut(cm.selecting);}],
        ]);
        this.setRightClick((event)=>{
            event.preventDefault();
            tcontrol.cm.show('demo_insert',event);
        });
        this.nowtblock.autoFitSize=true;
    }
}
export var TModelRegistry={         //[類別名]對應 : [類別,主鍵] 或 [類別,null]
    'tmodel':TModel,
    'rectmodel':RectModel,
};
//========================================================================================= 以下為TModelTElement
export class TModelTElement extends TElement{         //用 TElement 包裝 [一個] 任意類型的 TModel
    //----佔用 bdict: size, bgcolor, border, tmContent
    //---- tmodel 與 TElement 共用 bdict
    constructor(tblock,bdict,tmodel_class=null,loadTmString=false){
        if(tmodel_class==null) tmodel_class=TModel;
        bdict=defaultDict(bdict,{'size':'30,30','border':'0'});
        super(tblock,bdict);
        this.newEvent('resize');
        //----------------------------------------------------- 基本參數
        this.size=NumberArray(this.bdict['size']);
        //----------------------------------------------------- 建構內部 Tmodel
        let tmTElement=this;
        let tmodelStyle={'background-color':this.bdict['bgcolor'],'border':'0px'};
        if(this.bdict['border']=='1') tmodelStyle['border']='1px black solid';
        let tmObj=new tmodel_class(tblock.tcontrol,this.bdict,null,this.size,tmodelStyle);
        tmObj.addEvent('resize',(size)=>{
            tmTElement.setSize(size);
            tmTElement.trigger_event('resize',size);
            tblock.arrange();
        });
        this.tmObj=tmObj;
        this.nowtblock=tmObj.nowtblock;
        //----------------------
        this.addEvent('destroy',()=>{tmObj.destroy();});
        if(loadTmString) this.loadTmString();
    }
    setPos(pos){
        this.pos=pos;
        let relPos=this.tmodel.pos;
        this.tmObj.setPos([relPos[0]+this.pos[0],relPos[1]+this.pos[1]]);
    }
    setSize(size){
        this.size=size;
        this.bdict['size']=size[0]+','+size[1];
    }
    //-----------------------------------------------------------------渲染
    select(is_selected){
        super.select(is_selected);
        this.tmObj.select(is_selected);
    }
    render(){  //在 tmodel 設定 pos 時，就已經排列並渲染好了
        this.tmObj.renderData();
    }
    //-----------------------------------------------------------------
    loadTmString(tmString=null){
        if(tmString==null) tmString=this.bdict['tmString'];
        if(tmString){
            this.tmObj.loadTmString(tmString);
            return true;
        }
        return false;
    }
    getDict(){
        return this.tmObj.getDict();
    }
}
export class RectIBox extends TModelTElement{     //---------------------------方形輸入框元素
    constructor(tblock,bdict,tmodel_class=null){
        // tmodel 屬性
        bdict=defaultDict(bdict,{'size':'50,30','padding':'2,0','background':'white','border':'1'});
        //bdict['autoFitSize']='0';
        if(tmodel_class==null) tmodel_class=RectModel;
        super(tblock,bdict,tmodel_class);
        this.resizeLock=false;
        //------------------------------------------------------ 基本參數
        this.nowtblock=this.tmObj.nowtblock;
    }
    setSize(size){
        if(!this.resizeLock){
            this.resizeLock=true;
            if(this.nowtblock.relObjs.length==0){
                let lineHeight=this.nowtblock.lineHeight;
                let padding=NumberArray(this.bdict['padding']);
                super.setSize([size[0],lineHeight+padding[1]*2]);
                let rectBlock=[padding[0],padding[1],size[0]-padding[0]*2,lineHeight];
                this.nowtblock.setBlock(rectBlock);
            }else super.setSize(size);
            this.resizeLock=false;
        }
    }
}
export class TextIBox extends TModelTElement{           // [單行]文字輸入框
    constructor(tblock,bdict){
        bdict=defaultDict(bdict,{'size':'50,30','padding':'5,5','background':'yellow','border':'0'});
        super(tblock,bdict,RectTextModel);
        //-------------------------------------------------- 如果目前沒 content 可以載入，就用text初始化
        if(!this.tmObj.loadTmString() && this.bdict['text'])
            this.inputText(this.bdict['text']);
    }
    //-----------------------------------------------------------------外部接口
    inputText(text){
        this.tmObj.inputText(text);
    }
    getText(chartype='char',charkey='char'){
        return this.tmObj.getText(chartype,charkey);
    }
}

export class Table extends TModel{
    constructor(){
        cm.addMenu(0,'revise_table',[
            ['合併儲存格',function (event){tcontrol.tmodel.parent.combine_cells();}],
        ]);
        
        //---------------------------------------------------------------------
        cm.addMenu(1,'table',[
            ['新增&ensp;&ensp;▶','table_new'],
            ['刪除&ensp;&ensp;▶','table_delete'],
            ['清空此格',function (event){}],
            ['隱藏邊框',function (event){
                let table_obj=tcontrol.tmodel.parent;
                let border=['0px','0'];
                if(table_obj.bdict['bline']=='0')
                    border=['1px solid','1'];
                table_obj.set_border(border[0]);
                table_obj.bdict['bline']=border[1];
            }],
            ['解除合併',function (event){tcontrol.tmodel.parent.unmerge_cells()}],
        ]);
        cm.addMenu(2,'table_new',[
            ['向上新增一列',function(event){tcontrol.tmodel.parent.new_row('up');}],
            ['向下新增一列',function(event){tcontrol.tmodel.parent.new_row('down');}],
            ['向左新增一欄',function(event){tcontrol.tmodel.parent.new_col('left');}],
            ['向右新增一欄',function(event){tcontrol.tmodel.parent.new_col('right');}],
        ]);
        cm.addMenu(2,'table_delete',[
            ['刪除此列',function(event){tcontrol.tmodel.parent.del_row();}],
            ['刪除此欄',function(event){tcontrol.tmodel.parent.del_col();}],
        ]);
    }
}
TElementRegistry['rectibox']=[RectIBox,null];
TElementRegistry['textibox']=[TextIBox,'text'];