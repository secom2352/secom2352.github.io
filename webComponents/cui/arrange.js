

// 以默認方式(初代html方式)排列 nodeObj 的子元素內容
export function defaultArrange(nodeObj){
    let nodes=nodeObj.getDocumentFlow();   //取得文檔流(含 absolute 物件)
    //===================================================================================== 調用常數
    //----------------------------------------------------------------------- 座標邊界參數
    let startX=nodeObj.innerPos[0];         //排列初始位置(X)
    let y=nodeObj.innerPos[1];              //排列初始高度(Y)
    let endX=startX+nodeObj.getMaxInnerSize();  //取得排列可用的最大空間
    
    //----------------------------------------------- 排版設定
    let forbidChangeLine=nodeObj.nowrap;  //禁止換行
    //==========================================================運算參數
    let k=0;const n=this.nodes.length;
    let arrangeSize=[0,0];  //排列後，可排列物件(static 或 relative)的 占用尺寸
    
    let isFisrtBr=true;
    //===================================================================================== 總計算
    while (k<n){
        //-------------------------------------------------------單列計算
        let lineHeight=16;    //默認列高
        let p=k;              //單列起點
        let xpos=[startX];    //[第一物件的X,......,該列最後可排物件的X,無法排入物件的X(該列最右X)];
        let testX=startX;
        //--------------------特殊規則
        let blockbreak=false;    //block物件獨佔一列:這個 block物件處理完，下一個就break(換行)
        let ignoreSpace=true;    //空白忽略:只讀取夾在非block物件中的空白，其餘忽略
        while(k<n){
            if(blockbreak) break;
            let baseObj=nodes[k];
            if(baseObj.type=='br' && (xpos.length>1 || isFisrtBr)) break;  //強制換行
            if(baseObj.display=='block'){      //強制換行
                if(xpos.length>1) break;
                blockbreak=true;
                ignoreSpace=true;
            }else{
                if(baseObj instanceof CharNode && '\n '.includes(baseObj.char)){
                    if(baseObj.char==' ' && !ignoreSpace){}
                }else ignoreSpace=false;
                if(baseObj instanceof CharNode && 
                        (baseObj.char=='\n' || (ignoreSpace && baseObj.char==' '))){
                    xpos.push(testX);       //空白座標不便，且忽視該空白
                    k++;
                    continue;
                }else ignoreSpace=false;
            }
            testX+=baseObj.size[0];
            if(testX>endX){   //如果超出限制寬度
                if(!forbidChangeLine){  //若沒有禁止換行
                    if(xpos.length>1) break;  //該物件需排在下一行
                    else{
                        console.log('超寬，強制排入');
                        testX=endX;      //設置為最大寬度
                    }
                }
            }
            xpos.push(testX);  //將下一個 baseObj 該排在的 X 座標
            lineHeight=Math.max(baseObj.size[1],lineHeight);
        
            k++;
        }
        //-----------------------------------更新寬高
        innerSize[0]=Math.max(innerSize[0],xpos[xpos.length-1]-startX);
        innerSize[1]+=lineHeight;
        if(moreThan(y+lineHeight,this.limitRect[3])){
            console.log('高度無法塞入');
            return false;
        }
        //-----------------------------------開始設置
        if(isFisrtBr) isFisrtBr=false;
        for(let i=p;i<k;i++){
            let baseObj=nodes[i];
            //--------------------------------------------------------判斷這個位置有沒有問題
            baseObj.setPos([xpos[i-p],y+lineHeight-baseObj.size[1]]);  //向下對齊
        }
        //-----------------------------------更新座標
        y+=lineHeight;
        //if(k<n) height+=lineSpace;
    }
}