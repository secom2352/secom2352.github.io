-----------------------------------------------------------------tool.js
Path(path)                            #處理 "aaa/bbbb/c.dd" 之類的路徑
    .length=path_list.length;         #路徑層度
    .parent                           #該路徑的母資料夾

    .get(index)                       #當index=1，回傳 "bbbb"
    .get_range(index1,index2=null)    #當index1=0,index2=2，回傳 "aaa/bbbb"

void_function                         #一個空函數

----------------------------------------------------------------------依賴關係
