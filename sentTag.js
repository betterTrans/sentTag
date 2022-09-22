//==================================
// Global 全域變數
//==================================

// 行內標籤：參見 https://www.w3schools.com/html/html_blocks.asp
inline_tags = [
    'span', 'a', 'em', 'b', 'i', 'big', 'small', 'br', 'strong', 'sub', 'sup', 'tt', 'abbr',
    'img',
    'acronym', 'bdo',  'dfn', 'kbd', 'map', 'object', 'output', 'q', 'samp', 'time',
    'var', 'cite',
    'nobr',
];
// 區塊標籤：參見 https://www.w3schools.com/html/html_blocks.asp
block_tags= [
    'html', 'head', 'body',
    'section', 'nav', 'main', 'footer',
    'div', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'ul', 'ol', 'hr', 'colgroup', 'col', 'dl',
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'caption', 'th', 'td', 'li', 'dd', 'dt',
    'form', 'header',
    'address', 'article', 'aside', 'blockquote', 'canvas', 'fieldset',
    'figcaption', 'figure',
    'label',
    'button', 'input', 'select', 'textarea',
    // txt 檔案若在瀏覽器中開啟，其內容會被包在 pre 裡頭。。。
    'pre',
    // 下面是 Google Cloud Document 用到的一些特殊 tag
    'devsite-header', 'devsite-content', 'devsite-toc', 'devsite-footer-linkboxes', 'devsite-footer-utility',
    'devsite-language-selector', 'devsite-select',
    // 下面這些註解起來的，都會變成不明 tag，不會進行分句處理
    // 'code',
    // 'script',
    // 'video',
    // 'noscript',
];

//==================================
//  sent 句子相關函式
//==================================

// 分句 ==》輸入 html 或 dom（因為採用遞迴做法，所以兩種格式都要通吃），輸出一個已添加 sent 標籤的 html 字串。
function addSentTag2HTML(no_sent_html = 'html', depth = 0) {

    // 一開始應先檢查是否已經添加過 sent 標籤。。。

    var nodes = html_2_nodes(no_sent_html); // 輸入一律先轉換成 nodes 節點列表

    var sent_html = '';
    var inline_str = '';

    nodes.forEach((node) =>{

        var tag_name = node.nodeName.toLowerCase();

        if (tag_name == '#text') { // 沒有 outerHTML，採用 textContent
            inline_str += node.textContent; // 先存起來，暫時還不處理
        }
        else if (tag_name == '#comment') { // 沒有 outerHTML，採用 textContent，並手動恢復原狀
            inline_str += '<!--' + node.textContent + '-->'; // 先存起來，暫時還不處理
        }
        else if (inline_tags.indexOf(tag_name) >= 0) {
            inline_str += node.outerHTML;   // 先存起來，暫時還不處理
        }
        else if (block_tags.indexOf(tag_name) >= 0) {

            // 遇到 block_tag 了，前面先存起來的可以斷句了。。。
            // ==》先處理前面的斷句（這裡處理的應該是【開頭】或【中段】的文字）
            if (inline_str.length > 0) {
                sent_html += addSentTag(inline_str);
                inline_str = '';    // 處理完就清空
            }

            // 再處理後面的 block_tag
            // ==》用遞迴方式處理這個 node，處理完再掛到 sent_html 後面
            node.innerHTML = addSentTag2HTML(node, depth + 1);   // 這裡也會直接動到 node？？！！ 。。。
            // ==》處理完之後套接回去
            sent_html += node.outerHTML;
        }
        else {
            // 遇到不明 tag，前面可以斷句了。。。
            // ==》先處理前面的斷句（這裡處理的應該是【開頭】或【中段】的文字）
            if (inline_str.length > 0) {
                sent_html += addSentTag(inline_str);
                inline_str = '';    // 處理完就清空
            }

            // 再處理後面的 block_tag
            // ==》這個 node 是不明 tag，直接套接回去，不進行任何處理。。。
            sent_html += node.outerHTML;
        }
    });

    // Nodes 全部走完之後，若還有 inline_str 還沒處理完，就要進行處理（這裡處理的應該是【末尾】的文字）
    if (inline_str.length > 0) {
        sent_html += addSentTag(inline_str);
        inline_str = '';    // 處理完就清空
    }

    return sent_html;
}

// 添加 sent 標籤
function addSentTag(origHtml) {
    var new_html = '';

    var node = new DOMParser().parseFromString(origHtml, "text/html").body;
    
    // 如果沒有內文，什麼都不必做。。。
    if (node.textContent.trim().length == 0) {
        return origHtml;
    }

    // 先把前後的【空格、br、hr】拿掉
    var pre_blank = origHtml.match(/^((?:(?:\s+)|(?:<br ?\/?>)+|(?:<hr ?\/?>)+)*)/)[0];
    var post_blank = '';
    var re, temp_post_blank;
    // RegExp 的句尾 $ 處理很費時？？？ 自己寫程式處理。。。
    var striped_origHtml = origHtml
        .replace(/^((?:(?:\s+)|(?:<br ?\/?>)+|(?:<hr ?\/?>)+)*)((?!(?:\s+)|(?:<br ?\/?>)+|(?:<hr ?\/?>)+))/, '$2');
    while (striped_origHtml.match(/\s+$/)   // 尾部有空格
        || striped_origHtml.match(/<br ?\/?>$/) // 尾部有 br
        || striped_origHtml.match(/<hr ?\/?>$/) // 尾部有 hr
    ) {
        if (striped_origHtml.match(/\s+$/)) {
            temp_post_blank = striped_origHtml.match(/(?:[^\s])(\s+)$/)[1];
            re = new RegExp(temp_post_blank + '$');
            striped_origHtml = striped_origHtml.replace(re, '');
            post_blank = temp_post_blank + post_blank;
        }
        if (striped_origHtml.match(/<br ?\/?>$/)) {
            temp_post_blank = striped_origHtml.match(/(<br ?\/?>)$/)[0];
            re = new RegExp(temp_post_blank + '$');
            striped_origHtml = striped_origHtml.replace(re, '');
            post_blank = temp_post_blank + post_blank;
        }
        if (striped_origHtml.match(/<hr ?\/?>$/)) {
            temp_post_blank = striped_origHtml.match(/(<hr ?\/?>)$/)[0];
            re = new RegExp(temp_post_blank + '$');
            striped_origHtml = striped_origHtml.replace(re, '');
            post_blank = temp_post_blank + post_blank;
        }

        // 末尾的 <br/> <hr/> 空格，還沒有處理得很好。。。
        // post_blank = striped_origHtml.match(/((?:(?:\s+)|(?:<br ?\/?>)+|(?:<hr ?\/?>)+)*)$/)[0];
        // post_blank = striped_origHtml.match(/(?:[^\s])((?:(?:\s+)|(?:<br ?\/?>)+|(?:<hr ?\/?>)+)+)$/)[1];
        // post_blank = striped_origHtml.match(/(?:[^\s])(\s+)$/)[1];
    }

    var striped_node = new DOMParser().parseFromString(striped_origHtml, "text/html").body;

    // 如果沒有內文，什麼都不必做。。。
    if (striped_node.textContent.trim().length == 0) {
        return origHtml;
    }

    // 如果外圍有標籤包住（也就是只有一個 child），就用遞廻方式鑽進去裡面處理
    // =======================================================================================這裡有點怪怪的！！待確認！！！
    if (striped_node.childNodes.length == 1 && striped_node.childNodes[0].nodeName != '#text') {
        var node = striped_node.childNodes[0];
        node.innerHTML = addSentTag(node.innerHTML);   // 這裡做遞廻呼叫，把 innerHTML 送進去分句。。。
        new_html = node.outerHTML;
    }
    else {
        // 進行分句
        
        // （句末標點符號 + 零或一個括號、引號） + （一個以上的空白或 br 或 hr 或 \r 或 \n）+ （零或一個括號、引號 + 大寫字母或數字）
        // 特別注意！ 這裡在標點符號後面，一定要有空格所以 (?:(?:\s+)|(?:<br ?\/?>)+|(?:<hr ?\/?>)+) 後面用 +；後面檢查時不一定有空格所以用 *
        var re_en_sent_end_and_start = /([?.!:][\)\]\}"'”]?)((?:(?:\s+)|(?:<br ?\/?>)+|(?:<hr ?\/?>)+|(?:\n?\r\n?)+|(?:\r?\n\r?)+)+)([\(\[\{"'“]?(?:[A-Z0-9]|<[^\/]|\(\(|\#|\- ))/g;  // <標籤開頭; ((( 特殊符號？
        new_html = striped_origHtml.replace(re_en_sent_end_and_start, '$1</sent>$2<sent>$3');

        // 針對常見縮寫詞，移除分句效果
        var abbrs = ['Mr\\\.', 'Yahoo\\\!', 'St\\\.', 'H\\\.P\\\.', 'P\\\.S\\\.'];
        for (var ab in abbrs) {
            var reg = new RegExp('(' + abbrs[ab] + ')([\\\)\\\]\\\}"\\\'”]?)<\\\/sent>((?:(?:\\\s+)|(?:<br ?\\\/?>)+|(?:<hr ?\\\/?>)+)*)<sent>', 'g');
            new_html = new_html.replace(reg, '$1$2$3');
            new_html = new_html.replace(/([\s\.][A-Z][\.])<\/sent>((?:(?:\s+)|(?:<br ?\/?>)+|(?:<hr ?\/?>)+)*)<sent>/g, '$1$2');
        }

        // 如果 </sent><sent> 造成交叉 tag 的效果，就撤銷 </sent><sent>
        // 也就是如果出現 <xxx...>yyy</sent><sent>，<xxx> 沒有關閉，就撤銷後面的 sent
        while (new_html.match(/<(a|span|em|b|i|strong|img|tt)(?=[\s>])((?:\'[^\']*\'|\"[^\"]*\"|[^\'\">])*)>([^<>]*)<\/sent>((?:(?:\s+)|(?:<br ?\/?>)+|(?:<hr ?\/?>)+)*)<sent>/g)) {
            new_html = new_html.replace(/<(a|span|em|b|i|strong|br|img|tt)(?=[\s>])((?:\'[^\']*\'|\"[^\"]*\"|[^\'\">])*)>([^<>]*)<\/sent>((?:(?:\s+)|(?:<br ?\/?>)+|(?:<hr ?\/?>)+)*)<sent>/g, '<$1$2>$3$4');
        }

        new_html = "<sent>" + new_html + "</sent>";
    }

    // 最後要把前後的【空格、br、hr】加回去
    new_html = pre_blank + new_html + post_blank;

    return new_html;
}

// 移除 sent 標籤
function removeSentTag() {
    document.querySelectorAll("sent").forEach((node)=>{
        node.outerHTML = node.innerHTML;
    });

    html = document.documentElement.outerHTML;

    return html;
}

// 由於使用遞迴的做法，
// 因此送進來的 input_html 有可能是 html 字串，也有可能是 node 節點（可能是 document node 也可能是 element node）。
// 這個函式負責把送進來的 input_html 統一轉換成一個用根節點包起來的節點樹，再取其 childNodes 節點列表送回去！
function html_2_nodes(input_html = 'html') {
    var nodes;
    if (input_html == 'html') {
        // 這樣寫很不好！！使用了 document 這個全域變數，而不是透過參數送進來！！！==》最好再思考一下怎麼寫更好！！
        nodes = document.body.childNodes;
    }
    else if (typeof(input_html)=='string') {
        // 如果字串內有好幾個 element，就會拆成好幾個 dom。。。但使用 jquery 的話，第一個 Node 不能是 #text。。。 
        // 所以先用一個 div 把整個字串包起來
        // html_string = "<div>" + input_html + "</div>"   // 這樣就只會有一個 element
        // nodes = new DOMParser().parseFromString(html_string, "text/xml").childNodes[0].childNodes; // xml 一定只能有一個根 element，所以也要先用一個 div 包起來。
        nodes = new DOMParser().parseFromString(input_html, "text/html").body.childNodes;    // html 會用 html、head、body 打包起來。        
    }
    else if (typeof (input_html) == 'object' && 'nodeType' in input_html) {
        // 如果送進來的是 document，或是用 DOMParser()..."text/html" 所建立的 dom，應該就有 body 子節點。
        // 如果有 body 子節點，可直接取 body 節點
        if ('body' in input_html) {
            nodes = input_html.body.childNodes;
        }
        // 如果送進來的是用 DOMParser()..."text/xml" 所建立的 dom，沒有 body 節點，就取第一個子節點（這個子節點應該就是我們用來打包的 div）
        else if (input_html.nodeType==Node.DOCUMENT_NODE) { // 9
            nodes = input_html.childNodes[0].childNodes;
        }
        // 如果送進來的是一般的標籤節點，就直接送回子節點列表
        else if (input_html.nodeType==Node.ELEMENT_NODE // 1
            // || input_html.nodeType==Node.ATTRIBUTE_NODE // 2
            || input_html.nodeType==Node.TEXT_NODE // 3
            // || input_html.nodeType==Node.CDATA_SECTION_NODE // 4
            // || input_html.nodeType==Node.ENTITY_REFERENCE_NODE // 5 ==》已被棄用；參見 https://developer.mozilla.org/zh-TW/docs/Web/API/Node/nodeType
            // || input_html.nodeType==Node.ENTITY_NODE // 6 ==》已被棄用
            // || input_html.nodeType==Node.PROCESSING_INSTRUCTION_NODE // 7
            || input_html.nodeType==Node.COMMENT_NODE // 8
            // || input_html.nodeType==Node.DOCUMENT_TYPE_NODE // 10
            // || input_html.nodeType==Node.DOCUMENT_FRAGMENT_NODE // 11
            // || input_html.nodeType==Node.NOTATION_NODE // 12 ==》已被棄用
            ) {
            nodes = input_html.childNodes;
        }
        // 預設情況 ==》直接送回子節點列表（既然處理方式與上一個情況相同，上一個情況其實無需拉出來處理）
        else {
            nodes = input_html.childNodes;
        }
    }
    // 其實還有一種狀況，就是收到【節點列表】的情況。。。
    // else if () {
    //        
    //}
    else {
        msg = "將 html 轉換成節點列表時，輸入參數有誤！！"
        // console.log(msg)
        throw msg
    }

    return nodes

}
