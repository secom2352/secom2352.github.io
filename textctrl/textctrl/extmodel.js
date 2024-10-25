import { TModel } from "./tmodel.js";
import { Text,Image,Link,Table,Html} from "./extelement.js";

export class ExTModel extends TModel{
    constructor(tcontrol,element_obj){
        super(tcontrol,element_obj);
        Object.assign(this.TElementRegistry,{'text':Text,'image':Image,'link':Link,'table':Table,'html':Html});
    }
    insert_text(text_string,mdict=null){          //插入文字，mdict是除此之外要加入的屬性，文字會自動繼承先前屬性
        this.insert_telement(new Text(this,{'text':text_string}));
    }
    insert_image(src,mdict=null){         //插入圖片
        let bdict={'src':src};
        if(mdict!=null) Object.assign(bdict,mdict)
        let img=new Image(this,bdict);
        this.insert_telement(img);
        //let rect=img.get_rect();
        //if(width!=null || height!=null){
        //    if(width==null) width=rect[2];
        //    if(height==null) height=rect[3];
        //    img.transform('scale',[width/rect[2],height/rect[3]]);
        //}else{
        //    img.transform('scale',[rect[2]/2,rect[3]/2]);
        //}
    }
    insert_link(href,name){                      //插入連結
        this.insert_telement(new Link(this,{'text':name,'href':href}));
    } 
    insert_table(row,col){                         //插入表格
        this.insert_telement(new Table(this,{'ranks':`${row},${col}`}));
    }
    insert_html(html){                       //插入html
        this.insert_telement(new Html(this,{'html':html}));
    }

}