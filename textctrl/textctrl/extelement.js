import { convert_string, copy_dict, bdict_to_TeString,List_to_LString,LString_to_List} from "./tool.js";
import { TElement } from "./telement.js";

export class Text extends TElement{           //----------------------一串文字
    constructor(tmodel,bdict){
        bdict['type']='text';
        let innerHTML=`<span>${convert_string(bdict['text'])}</span>`;
        super(tmodel,bdict,innerHTML);
    }
}
export class Image extends TElement{           //----------------------一般圖片
    constructor(tmodel,bdict,scale=null){
        bdict['type']='image';
        let innerHTML=`<span><img src="${bdict['src']}" style="max-width:${tmodel.max_width}px"></span>`;
        super(tmodel,bdict,innerHTML);
        this.element.onload=()=>{
            if(scale==null) scale=[this.element.offsetWidth,this.element.offsetHeight];
            this.update({'scale':scale});
        }
    }
}
export class Link extends TElement{           //----------------------一般連結
    constructor(tmodel,bdict){
        bdict['type']='link';
        let innerHTML=`<a href="${bdict['href']}">${bdict['text']}</a>`;
        super(tmodel,bdict,innerHTML);
    }
}
export class Table extends TElement{           //----------------------一般表格
    constructor(tmodel,bdict){
        bdict['type']='table';
        super(tmodel,bdict,`<table style="border:1px solid;max-width:${tmodel.max_width}px;"></table>`);
        //-------------------------------------置入table內容
        let ranks=bdict['ranks'].split(',');
        let row=parseInt(ranks[0]);
        let col=parseInt(ranks[1]);
        let max_width=tmodel.max_width/row;
        this._ths=[];
        for(let i=0;i<row;i++){
            let tr=document.createElement('tr');
                tr.style.border='1px solid';
                tr.style.position='relative';
                for(let j=0;j<col;j++){
                    let _th=document.createElement('th');
                    _th.style="border:1px solid;font-weight:300;position:relative;text-align:left;vertical-align:top;";
                    _th.style.maxWidth=max_width+'px';
                    tr.appendChild(_th);                   
                    this._ths.push(_th);
                }
                this.element.appendChild(tr);
        }
        this.first_update=false;
    }
    update(ndict=null){     //確保自身已被插入document中
        super.update(ndict);
        //-----------------------------
        if(!this.first_update){
            let max_width=this.tmodel.max_width/parseInt(this.bdict['ranks'].split(',')[0]);
            this.tmodels=[];
            let tcontrol=this.tmodel.tcontrol;
            let contents=[];
            if(this.bdict['contents']) contents=LString_to_List(this.bdict['contents']);
            for(let i=0;i<this._ths.length;i++){
                let tmodel=tcontrol.NewTModel(this._ths[i]);
                tmodel.max_width=max_width;
                if(contents.length>0) tmodel.LoadString(contents[i]);
                this.tmodels.push(tmodel);
            }
            this.first_update=true;
        }
    }
    ToString(){
        let contents=[];
        for(let i=0;i<this.tmodels.length;i++){
            contents.push(this.tmodels[i].ToString());
        }
        this.bdict['contents']=List_to_LString(contents);
        return bdict_to_TeString(this.bdict,['contents']);
    }
}
export class Html extends TElement{           //----------------------一段html
    constructor(tmodel,bdict){
        bdict['type']='html';
        let innerHTML=`<span>${bdict['html']}</span>`;
        super(tmodel,bdict,innerHTML);
    }
}
