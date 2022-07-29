// ==UserScript==
// @name         Auto toc-bar
// @namespace    http://tampermonkey.net/
// @author hikerpig and me
// @license MIT
// @description A floating table of content widget
// @description:zh-CN 自动生成文章大纲目录，在页面右侧展示一个浮动的组件。覆盖常用在线阅读资讯站（技术向）。github/medium/MDN/掘金/简书等
// @version 1.7.0
// @match *://*/*.html
// @match *://*/*
// @exclude https://www.bilibili.com/video/*
// @exclude https://www.runoob.com/try*
// @run-at document-idle
// @grant GM_getResourceText
// @grant GM_addStyle
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_log
// @grant GM_openInTab
// @grant GM_setClipboard
// @noframes
// @require http://code.jquery.com/jquery-1.11.0.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.min.js
// @require https://apps.bdimg.com/libs/highlight.js/9.1.0/highlight.min.js
// @resource css https://apps.bdimg.com/libs/highlight.js/9.1.0/styles/rainbow.min.css
// @require https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.14.0/beautify.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.14.0/beautify-css.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.14.0/beautify-html.min.js

// @icon https://raw.githubusercontent.com/hikerpig/toc-bar-userscript/master/toc-logo.svg
// @homepageURL https://github.com/hikerpig/toc-bar-userscript
// ==/UserScript==

(function() {

    // 全局可用变量
    const SITE_SETTINGS = {
        "def": {
            contentSelector: '[myAttr*="wenzhangdiv"]',
        }
    }

    // 是否包含代码块
    function hasCode(params) {
        let precode = params.querySelectorAll("pre,code");
        // let codeimg = document.querySelectorAll(":is(pre,[class*='code']:not([class*='qr']),[id*='code']:not([id*='qr']),.table-wrapper) img");
        let codeNum = 0
        precode = makeAarry(precode)
        for (const iterator of precode) {
            if (iterator.querySelectorAll("img").length == 1 || iterator.innerText.length == 0 || iterator.offsetWidth < 400) {
                // precode.remove(iterator)
            } else {
                iterator.setAttribute("code", "Code")
                console.log("输出代码块：");
                codeNum++
                console.log(iterator);
            }
        }
        console.log("代码块数：" + codeNum);
        return codeNum
    }

    // 标记是否有标题
    let hasOption;
    // 标记是否有文章模块
    let hasAtr;
    // body是否有代码块
    let bodycodenum;
    //初选文章容器
    let main;
    //终选文章最小容器
    let wenzhangzhuti;

    // nodelist转数组
    function makeAarry(nodelist) {
        let arr = [];
        for (let i = 0, len = nodelist.length; i < len; i++) {
            arr.push(nodelist[i]);
        }

        return arr;
    }

    //定义数组remove方法
    Array.prototype.indexOf = function(val) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] == val) return i;
        }
        return -1;
    };
    Array.prototype.remove = function(val) {
        let index = this.indexOf(val);
        if (index > -1) {
            this.splice(index, 1);
        }
    };

    // 主体选择器 section
    let zhutis = document.querySelectorAll(":is(dd,.GM2GFRGCNNB,article,[id*='Article'],[class*='Article'],[id*='article'],[class*='article'],[id*='Body'],[class*='Body'],[id*='body'],[class*='body'],main,[role=main],[id*='Main'],[class*='Main'],[id*='main'],[class*='main'],[id*='Content'],[class*='Content'],[id*='content'],[class*='content'],[class*='Post'],[id*='Post'],[class*='post'],[id*='post'],[class*='left'],[id*='left'],[class*='right'],[id*='right']):not([class*='code'],[id*='code'])");

    let num = 0 //记录getWen函数的执行次数
    function getWen() {
        num++;
        // 功能：寻找wenzhangzhuti
        // 初选
        // 是否有article文章模块
        let atr = document.querySelectorAll("article");
        // body是否有代码块
        bodycodenum = hasCode(document.body);

        // 去除图片干扰
        let imgsty = document.createElement("style")
        document.body.prepend(imgsty);
        imgsty.innerText = "img{display:none}"

        if (atr.length > 0) {
            // 符合在屏幕中轴区域 且 需要落在屏幕中
            const left = atr[0].getBoundingClientRect().left + document.documentElement.scrollLeft;
            const right = window.screen.availWidth - atr[0].clientWidth - left;
            if ((window.screen.availWidth - left > window.screen.availWidth / 2 && window.screen.availWidth - right > window.screen.availWidth / 2) && atr[0].getBoundingClientRect().top + document.documentElement.scrollTop < window.screen.availHeight && atr[0].innerText.length > 0 && (location.href.indexOf("article") != -1 || atr[0].querySelectorAll("p").length > 0 || hasCode(atr[0]))) {
                hasAtr = true;
                main = atr[0];
                console.log("本文章有符合要求的article模块");
            }
        }

        if (!hasAtr) {

            let zhutiArry = [];
            // let top = document.querySelector("body").getBoundingClientRect().top;
            for (const i of zhutis) {
                // 大小限制
                // if (i.clientHeight > 300 && i.clientWidth > document.body.clientWidth * 3 / 7) {
                // if (i.clientHeight > 300 && i.clientWidth > 300) {
                // 符合在屏幕中轴区域
                const left = i.getBoundingClientRect().left + document.documentElement.scrollLeft;
                const right = window.screen.availWidth - i.clientWidth - left;
                if (window.screen.availWidth - left > window.screen.availWidth / 2 && window.screen.availWidth - right > window.screen.availWidth / 2) {
                    // 纵坐标在屏幕中
                    if (i.getBoundingClientRect().top + document.documentElement.scrollTop < window.screen.availHeight) {
                        // 要有文字文本
                        if (i.innerText.length > 100) {
                            // 如果有代码块，那么main也要有
                            let maincode = i.querySelectorAll("[code]");
                            console.log("初选item代码块数：" + maincode.length);
                            if (bodycodenum && !maincode.length) {
                                continue
                            }
                            zhutiArry.push(i)
                        }

                    }
                }

                // }
            }

            main = zhutiArry.pop();
        }

        if (window.location.host == "app.yinxiang.com" && document.querySelector(".GM2GFRGCNNB")) {
            main = document.querySelector(".GM2GFRGCNNB")
        }

        if (!main) {
            zhutis = document.querySelectorAll("div")

            if (zhutis.length == 1) {
                main = zhutis[0]
            }
            if (zhutis.length > 1 && num < 3) {
                getWen()
            }
            if (!zhutis.length) {
                return
            }
            // $(document).ready(
            //     function () {
            // document.body.innerHTML = "<div>" + document.body.innerHTML + "</div>";
            // main = document.body.firstElementChild
            //     }
            // )
        }

        main.setAttribute("mainDiv", "mainDiv");



        // 标记是否包含P
        let hasP = false;
        let Ps = main.querySelectorAll("p:not(ul p,a p,p[class],p[id],header p,footer p,[id*='comment'] p,[class*='comment'] p)");
        if (Ps.length) {
            for (const iterator of Ps) {
                console.log("P:" + iterator.innerText);
            }
            hasP = true;
        }


        // 终选
        let wenzhangzhutiS = [];
        let mainChilds = main.querySelectorAll("div:not([class*='code'],[class*='code'] *,[id*='code'],[id*='code'] *)");

        if (hasAtr) {
            mainChilds = main.querySelectorAll(":is([id*='Body'],[class*='Body'],[id*='body'],[class*='body'],main,[role=main],[id*='Main'],[class*='Main'],[id*='main'],[class*='main'],[id*='Content'],[class*='Content'],[id*='content'],[class*='content'],[class*='Post'],[id*='Post'],[class*='post'],[id*='post'],[class*='left'],[id*='left'],[class*='right'],[id*='right']):not([class*='code'],[id*='code'])")
        }

        for (let index = 0; index < mainChilds.length; index++) {
            if (mainChilds[index]) {
                // 大小限制
                // if (mainChilds[index].clientHeight > 500) {
                // 符合在屏幕中轴区域
                const left = mainChilds[index].getBoundingClientRect().left + document.documentElement.scrollLeft;
                const right = window.screen.availWidth - mainChilds[index].clientWidth - left;
                if (window.screen.availWidth - left > window.screen.availWidth / 2 && window.screen.availWidth - right > window.screen.availWidth / 2) {
                    // 纵坐标在屏幕中，文字数量大于零
                    if (mainChilds[index].getBoundingClientRect().top + document.documentElement.scrollTop < window.screen.availHeight && mainChilds[index].innerText.length > 0) {
                        // 如果有代码块，那么wenzhangzhuti也要有
                        let wencode = mainChilds[index].querySelectorAll("[code]");
                        console.log("终选item代码块数：" + wencode.length);
                        if (bodycodenum && !wencode.length) {
                            continue
                        }

                        let ps = mainChilds[index].querySelectorAll("p:not(ul p,a p,p[class],p[id])");
                        // 存在p标签
                        if (hasP) {
                            if (Ps.length == ps.length) {
                                wenzhangzhutiS.push(mainChilds[index])
                            }
                        } else {
                            //无P标签者，高度要大于初选main的高度的一半
                            if (mainChilds[index].clientHeight > main.clientHeight / 2) {
                                wenzhangzhutiS.push(mainChilds[index])
                            }
                        }


                    }

                }
            } else {
                break
            }
        }

        if (wenzhangzhutiS.length > 0) {
            wenzhangzhuti = wenzhangzhutiS.pop();
        } else {
            wenzhangzhuti = main;
        }

        wenzhangzhuti.setAttribute("myAttr", "wenzhangdiv");

        // 恢复图片显示
        imgsty.remove();

    }

    // 处理换行问题,拆解重组
    function handleBr(items) { //接受节点列表
        let remake = false //标记是否重组了
            // items = makeAarry(items)
        for (let item of items) {
            let html = item.innerHTML
            if (html.indexOf("<br>") != -1 && item.firstElementChild) {
                remake = true
                let Newhtml = ""
                let lines = html.split("<br>")
                for (let line of lines) {
                    let tag = item.tagName.toLowerCase()
                    line = "<" + tag + ">" + line + "</" + tag + ">"
                    Newhtml = Newhtml + line
                }
                item.innerHTML = Newhtml
                item.outerHTML = item.innerHTML
            }
        }
        return remake
    }

    function getTitle() {
        // 功能（依赖wenzhangzhuti）：处理标题
        // 获取宽度
        // let wenStyle = window.getComputedStyle(wenzhangzhuti, null); //获取文章最终样式
        // let wenWidth = parseFloat(wenStyle.getPropertyValue('width')); //获取文章宽度

        // 临时宽度
        // wenzhangzhuti.style.width = "800px";
        //使用setProperty  如果要设置!important，推荐用这种方法设置第三个参数,属性名不用驼峰写法
        wenzhangzhuti.style.setProperty('box-sizing', 'content-box', 'important');
        wenzhangzhuti.style.setProperty('width', '800px', 'important');
        wenzhangzhuti.style.setProperty('padding', '40px', 'important');

        // 推荐模块排除后再选择
        //去除关于、分享，猜你，兴趣，文章，相关，更多，推荐
        let abouts = wenzhangzhuti.querySelectorAll("ul,ol")
        if (abouts.length) {
            for (const iterator of abouts) {
                let lis = iterator.querySelectorAll("li")
                if (lis.length == iterator.children.length) {
                    iterator.setAttribute("noth", "noth")
                }

                let lia = iterator.querySelectorAll("li a[href*='/']:not([conversion])")
                if (lia.length == iterator.children.length) {
                    // 正则 /^(\d{1,2}(\.|\、|）|\))){1}(.){2,30}/;
                    let pattT = /(关于|分享|猜你|兴趣|文章|相关|更多|推荐)/
                    let preBrother = iterator.previousElementSibling
                    if (preBrother && preBrother.offsetHeight < 70 && pattT.test(preBrother.innerText)) {
                        preBrother.setAttribute("about", "brother")
                        iterator.setAttribute("about", "about")

                        let father = iterator.parentElement
                        if (father && father.offsetHeight < iterator.offsetHeight + 100) {
                            father.setAttribute("about", "father")
                        }
                    }
                }
            }
        }

        // 排除标题
        let preHeads = wenzhangzhuti.querySelectorAll(":is(h1,h2,h3,h4,h5):not(:is(code,pre,iframe) *,[about])");
        // if (window.location.host == "app.yinxiang.com") {
        //     preHeads = document.querySelectorAll(":is(h1,h2,h3,h4,h5):not(:is(code,pre,iframe) *)");
        // }

        // let Left = wenzhangzhuti.querySelector("[myAttr] *").offsetLeft;

        // 通过判断标题的左边距离是否符合预期
        let style = window.getComputedStyle(wenzhangzhuti, null); //获取文章最终样式
        let paddingL = parseFloat(style.getPropertyValue('padding-left')); //获取文章左侧内边距
        // let Left = wenzhangzhuti.offsetLeft + paddingL;

        // 文章内容横坐标
        let Left = wenzhangzhuti.getBoundingClientRect().left + document.documentElement.scrollLeft + paddingL;

        // 文章中轴
        let Wcenter = wenzhangzhuti.getBoundingClientRect().left + document.documentElement.scrollLeft + wenzhangzhuti.offsetWidth / 2;

        let Num1 = preHeads.length; //统计排除后剩余数量


        for (const iterator of preHeads) {
            // 如果标题位置偏离 或者 B标签和strong标签是嵌套的话，排除掉
            // if (iterator.offsetLeft - Left > 10 || iterator.parentNode.innerText.length - iterator.innerText.length > 0) {
            // 有效字符串
            let text = iterator.innerText.replace(/[\r\n]/g, "").trim();

            // 如果包含a标签，且连续，则排除 && ((iterator.nextElementSibling && pattHead.test(iterator.nextElementSibling.tagName)) || (iterator.previousElementSibling && pattHead.test(iterator.previousElementSibling.tagName)))
            // 正则 
            // let pattHead = /^H(\d){1}/
            if (iterator.querySelectorAll("a").length > 0) {
                Num1--;
            }

            // 标题左坐标
            let HLeft = iterator.getBoundingClientRect().left + document.documentElement.scrollLeft;
            if (HLeft > Wcenter || text.length < 2) {
                // let X = iterator.getBoundingClientRect().left + document.documentElement.scrollLeft;
                // if (X - Left > 50 && hasAtr == false) {
                iterator.setAttribute("Ex", "exclusion");
                Num1--;
            } else {
                iterator.setAttribute("head", "head"); //符合条件即可获得head属性
            }
        }




        // 如果h开头的标签少于三个，就找疑似标题的标签，并筛选之
        let preNotH = wenzhangzhuti.querySelectorAll(":is([class*='strong'],strong,b,font,[myAttr] li:not([highlight] li,[about] li,li::before),.bjh-h3):not(:is(code,pre,iframe,table,[noth]) *,[about])");
        // if (window.location.host == "app.yinxiang.com") {
        //     preNotH = document.querySelectorAll(":is([class*='strong'],strong,b,font,[myAttr]>li,.bjh-h3):not(:is(code,pre,iframe) *)");
        // }

        // 处理换行问题,拆解重组
        if (handleBr(preNotH)) {
            preNotH = wenzhangzhuti.querySelectorAll(":is([class*='strong'],strong,b,font,[myAttr] li:not([highlight] li,[about] li,li::before),.bjh-h3):not(:is(code,pre,iframe,table,[noth]) *,[about])")
        }


        // 左坐标众数为准
        let lefts = [];
        for (const iterator of preNotH) {
            lefts.push(Math.round((iterator.getBoundingClientRect().left + document.documentElement.scrollLeft) / 10) * 10);
        }

        /**
         * @param {number[]} nums
         * @return {number}
         */
        majorityElement = function(nums) {
            let hash = {}
            let majority_element
            let max_num = 0
            for (let num of nums) {
                if (hash[num]) {
                    hash[num]++
                } else {
                    hash[num] = 1
                }
                if (hash[num] > max_num) {
                    max_num = hash[num]
                    majority_element = num
                }
            }
            return majority_element
        }

        let Left2 = majorityElement(lefts); //标准横坐标

        // 中轴众数为准
        let middles = [];
        for (const iterator of preNotH) {
            // 有效字符串
            let text = iterator.innerText.replace(/[\r\n]/g, "").trim();
            // 左边横坐标
            let ILeft = iterator.getBoundingClientRect().left + document.documentElement.scrollLeft;
            // 右边横坐标
            let Iright = ILeft + iterator.offsetWidth;
            if (Wcenter > ILeft && Wcenter < Iright && iterator.parentElement != wenzhangzhuti && iterator.parentElement.innerText.replace(/[\r\n]/g, "").trim().length == text.length && iterator.offsetHeight < 40 && text.length > 2) {
                middles.push(Math.round((iterator.getBoundingClientRect().left + document.documentElement.scrollLeft) / 10) * 10 + iterator.offsetWidth / 2);
            }

        }

        let middle = majorityElement(middles); //标准中轴


        let WillShowItems = makeAarry(preNotH); //将会显示的标题数组

        for (let i = 0; i < preNotH.length; i++) {
            const iterator = preNotH[i];
            iterator.setAttribute("head2", "head2"); //使之获取head2属性，后续使用css选择器去重

            // 横坐标不符且偏离中轴,则排除；含有句号,则排除；如果是文段里的, 占两行且无标题标志，也要排除;其父节点是标题，要排除
            // 左边横坐标
            let ILeft = iterator.getBoundingClientRect().left + document.documentElement.scrollLeft;
            // 中轴坐标
            let Icenter = ILeft + iterator.offsetWidth / 2;
            // 右边横坐标 (iterator.offsetHeight > 40 )
            // let Iright = ILeft + iterator.offsetWidth;
            // 有效字符串
            let text = iterator.innerText.replace(/[\r\n]/g, "").trim();
            // 正则汉字数字、 二级标题
            let pattH = /^[一二三四五六七八九十]{1,2}(\.|\、){1}(.){2,30}/
            let panduanH = pattH.test(text);
            // 正则阿拉伯数字. 三级标题
            let pattA = /^(\d{1,2}\.|\d{1,2}\、){1}(.){2,30}/;
            let panduanA = pattA.test(text);

            // Wcenter > ILeft && Wcenter < Iright && iterator.parentElement != wenzhangzhuti && iterator.parentElement.innerText.replace(/[\r\n]/g, "").trim().length != text.length && (panduanH == false || panduanA == false)
            // && Math.abs(ILeft - Left2) > 10
            // || text.split("。").length > 1
            if (Math.abs(ILeft - Left2) > 10 && Math.abs(Icenter - middle) > 10 && Math.abs(Icenter - Wcenter) > 40 && iterator.parentElement != wenzhangzhuti && iterator.parentElement.innerText.replace(/[\r\n]/g, "").trim().length != text.length || iterator.parentElement.hasAttribute("head") || iterator.parentElement.hasAttribute("head2") || text.length < 2 || iterator.parentElement != wenzhangzhuti && iterator.parentElement.innerText.replace(/[\r\n]/g, "").trim().length != text.length && iterator.offsetHeight > 40 && panduanH == false && panduanA == false || Math.abs(ILeft - Left2) > 10 && iterator.offsetHeight < 40 && iterator.parentElement != wenzhangzhuti && iterator.parentElement.innerText.replace(/[\r\n]/g, "").trim().length != text.length || (text.split("。").length > 1 && panduanH == false && panduanA == false) || Wcenter < ILeft) {
                iterator.setAttribute("Ex", "exclusion");
                WillShowItems.remove(iterator);
            }

        }

        let Num2 = WillShowItems.length; //排除后的余量

        // 将会显示的标题只有一个，也不再显示
        if (Num2 == 1) {
            WillShowItems[0].setAttribute("Ex", "exclusion");
        }



        // 遍历将要显示的标题，如果有序号或在中轴的话，将作为h标签显示
        if (Num1 < 3) {
            for (const i of WillShowItems) {
                // 横坐标
                let ILeft = i.getBoundingClientRect().left + document.documentElement.scrollLeft;
                // 右边横坐标
                // let Iright = ILeft + i.offsetWidth;
                // 中轴坐标
                let Icenter = ILeft + i.offsetWidth / 2;
                // 有效字符串
                let text = i.innerText.replace(/[\r\n]/g, "").trim();

                let pattH = /^[一二三四五六七八九十]{1,2}(\.|\、){1}(.){2,30}/
                let panduanH = pattH.test(text);
                let pattA = /^(\d{1,2}\.|\d{1,2}\、){1}(.){2,30}/;
                let panduanA = pattA.test(text);

                // if (Math.abs(ILeft - Left2) < 10||) {
                // 正则汉字数字、 二级标题
                if (panduanH) {
                    // i.removeAttribute("head2");
                    i.innerHTML = "<h2 head='append'>" + text + "</h2>";
                    console.log("添加了h2标签");
                }
                // 正则阿拉伯数字. 三级标题
                if (panduanA) {
                    // i.removeAttribute("head2");
                    i.innerHTML = "<h3 head='append'>" + text + "</h3>";
                    console.log("添加了h3标签");
                }
                // }

                // 无正则但居中 四级标题
                // 字数与物理长度向契合 Math.abs(i.offsetWidth - text.length * 20) < 60)
                // 非文本嵌套
                if (!panduanH && !panduanA && (Math.abs(Icenter - middle) < 10 || Math.abs(Icenter - Wcenter) < 40) && i.offsetHeight < 40 && i.parentElement != wenzhangzhuti && i.parentElement.innerText.replace(/[\r\n]/g, "").trim().length == text.length && i.offsetWidth - text.length * 20 < 60 && ILeft != Left) {
                    // i.removeAttribute("head2");
                    i.innerHTML = "<h4 head='append'>" + text + "</h4>";
                    console.log("添加了h4标签");
                }

                if (i.querySelectorAll("[head]").length) {
                    i.removeAttribute("head2");
                }
            }
        }


        // 寻找隐性标题

        // if (Num1 < 3 && Num2 < 1) {
        if (Num1 < 3 && Num2 < 3) {

            // 寻找有序号的p标签
            let eles = wenzhangzhuti.querySelectorAll("p:not(:is(code,pre,iframe) *)");
            // if (window.location.host == "app.yinxiang.com") {
            //     eles = document.querySelectorAll("p:not(:is(code,pre,iframe) *)");
            // }

            // 处理换行问题,拆解重组
            if (handleBr(eles)) {
                eles = wenzhangzhuti.querySelectorAll("p:not(:is(code,pre,iframe) *)");
            }

            console.log("p标签的数量" + eles.length);
            // let tem
            let h = 0;
            for (const i of eles) {
                // 有效字符串
                let text = i.innerText.replace(/[\r\n]/g, "").trim();

                console.log("执行");
                let pattH = /^[一二三四五六七八九十]{1,2}(\.|\、){1}(.){2,30}/
                    // let patt = /^([\u4E00-\u9FA5]{1,2}\.|[\u4E00-\u9FA5]{1,2}\、){1}([\u4E00-\u9FA5A-Za-z0-9_]){2,30}/;
                let panduanH = pattH.test(text);

                if (panduanH) {
                    console.log("正则匹配" + text);
                    if (i.getBoundingClientRect().left - Left < 10) {

                        // 一分为二
                        let space = ""
                        let point = text.match(/[:,?;：，。？；]/u) //一个数组，第一个元素的是正则匹配结果
                        let textList = []
                        if (point) {
                            space = point[0]

                            i.outerHTML = "<h2 head>" + text.substring(0, space + 1) + "</h2> <p>" + text.substring(space + 1) + "</P>";
                            console.log("P标签添加了h2标签");
                            h++;
                        } else {
                            i.innerHTML = "<h2 head='append'>" + text + "</h2>";
                            console.log("P标签添加了h2标签");
                            h++;
                        }


                    }
                }

                let pattA = /^(\d{1,2}(\.|\、|）|\))){1}(.){2,30}/;
                let panduanA = pattA.test(text);
                if (panduanA) {
                    console.log("正则匹配" + text);
                    if (i.getBoundingClientRect().left - Left < 10) {
                        // i.setAttribute("class", "h3");

                        // 一分为二
                        let space = ""
                        let point = text.match(/[:,?;：，。？；]/u) //一个数组，第一个元素的是正则匹配结果
                        let textList = []
                        if (point) {
                            space = text.indexOf(point[0])

                            i.outerHTML = "<h3 head>" + text.substring(0, space + 1) + "</h3> <p>" + text.substring(space + 1) + "</P>";
                            console.log("P标签添加了h3标签");
                            h++;
                        } else {
                            i.innerHTML = "<h3 head='append'>" + text + "</h3>";
                            console.log("P标签添加了h3标签");
                            h++;
                        }
                        // if (i.getBoundingClientRect().left - Left > 10) {
                        // iterator.setAttribute("Ex", "exclusion");
                        // h--;
                        // }
                    }
                }

            }
            console.log("隐性标题数量:" + h);

            if (h < 3 && Num2 < 3) {
                // 若啥也没有，则标记没有标题
                hasOption = false;
            }
        }
        // 恢复宽度
        wenzhangzhuti.style.removeProperty("width");
        wenzhangzhuti.style.removeProperty("box-sizing");
        wenzhangzhuti.style.removeProperty("padding");
    }


    function handelLink() {
        // 功能（依赖wenzhangzhuti）：处理链接
        // 主体内容设置完毕
        // 文本转链接
        // let jjjq = $.noConflict();
        // let webSiteReg = new RegExp('((http[s]{0,1}|ftp)://[a-zA-Z0-9\\.\\-]+\\.([a-zA-Z]{2,4})(:\\d+)?(/[a-zA-Z0-9\\.\\-~!@#$%^&*+?:_/=<>]*)?)|((www.)|[a-zA-Z0-9\\.\\-]+\\.([a-zA-Z]{2,4})(:\\d+)?(/[a-zA-Z0-9\\.\\-~!@#$%^&*+?:_/=<>]*)?)', 'g');
        // let wenText = wenzhangzhuti.innerText
        // wenText = wenText.replace(webSiteReg, "<a href='$1' target='_blank'>$1</a>");

        let rep = /(https?|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
        // let linkList = $('[myAttr]').text().match(rep);
        let linkList = wenzhangzhuti.innerText.match(rep);
        if (linkList && linkList.length) {
            let flag = false;
            for (let link of linkList) {
                let elements = $('[myattr] :contains(' + link + ')');
                //   = elements[elements.length - 1];
                // makeAarry
                if (!elements.length) {
                    continue
                }
                elements = makeAarry(elements)
                let element = undefined;
                for (const iterator of elements) {
                    if (iterator) {
                        // 不要code里面的a
                        if (iterator.tagName == "CODE") {
                            flag = true
                            break //结束循环
                        }
                        // elements.remove(iterator)
                        if (iterator.innerText.length == link.length) {
                            element = iterator
                        }
                    }
                }
                if (flag) {
                    break;
                }


                // 如果上面没找到，则取最后一个
                if (!element) {
                    let lastE = elements[elements.length - 1];
                    let webSiteReg = new RegExp('((http[s]{0,1}|ftp)://[a-zA-Z0-9\\.\\-]+\\.([a-zA-Z]{2,4})(:\\d+)?(/[a-zA-Z0-9\\.\\-~!@#$%^&*+?:_/=<>]*)?)|((www.)|[a-zA-Z0-9\\.\\-]+\\.([a-zA-Z]{2,4})(:\\d+)?(/[a-zA-Z0-9\\.\\-~!@#$%^&*+?:_/=<>]*)?)', 'g');
                    lastE.innerText = lastE.innerText.replace(webSiteReg, "$1 ");
                    lastE.innerHTML = lastE.innerHTML.replace(webSiteReg, "<a conversion href='$1' target='_blank'>$1</a>");
                    console.log("...");
                }

                if (element) {
                    if (element.tagName == 'A') {
                        // 在新页面打开
                        // element.setAttribute("target", "_blank")
                        element.setAttribute("href", link)
                        continue;
                    }
                    let newHTML = element.innerText.replace(link, "<a conversion href=\'" + link + "\' target='_blank'>" + link + "</a>");
                    element.innerHTML = newHTML;
                }

            }
        }


        // href="https://link.juejin.cn?target=https%3A%2F%2Fmp.weixin.qq.com%2Fs%2FuhL9VZuKg1-CtnGlI0YO7A"
        // 去重定向，直接访问


        let links = document.querySelectorAll("a");

        for (const iterator of links) {
            let href = iterator.getAttribute("href")
            if (href && href.length && href.indexOf("http") != -1) {
                let hrefs = href.split("=");
                if (hrefs.length > 1) {
                    let target = hrefs.pop(); // 重定向地址

                    // 转码
                    if (target.split("%").length > 1) {
                        let unescapeUrl = unescape(target)
                        if (unescapeUrl.split("%").length > 1) {
                            let decodeURIurl = decodeURI(target)
                            if (decodeURIurl.split("%").length > 1) {
                                let decodeURIComponenturl = decodeURIComponent(target)
                                if (decodeURIComponenturl.split("%").length > 1) {

                                } else {
                                    iterator.setAttribute("href", decodeURIComponenturl)
                                }
                            } else {
                                iterator.setAttribute("href", decodeURIurl)
                            }
                        } else {
                            iterator.setAttribute("href", unescapeUrl)
                        }
                    }

                    // 重写点击链接事件
                    iterator.onclick = function() {
                        //active:true，新标签页获取页面焦点  
                        //setParent :true:新标签页面关闭后，焦点重新回到源页面  
                        GM_openInTab(iterator.getAttribute("href"), {
                            active: true,
                            setParent: true
                        });
                    }



                }
            }
        }

    }

    // 页面简洁处理
    function clean() {

        // wenzhangzhuti祖先元素添加属性
        $("[myattr]").parents().each(function() {
            this.setAttribute("wenwen", "parents")
        });

        // 功能（任意时段，独立）：添加头部标题
        let ti = document.createElement("div");
        ti.setAttribute("wenwen", "title");
        document.body.prepend(ti);
        let titleStrs = document.title.split(/-|_/);

        // if (titleStrs.length > 2) {
        // for (let i = 0; i < titleStrs.length - 2; i++) {
        // titleStr = titleStr + titleStrs[i]
        // }

        // [a-zA-Z]
        let pattT = /[a-zA-Z]$/;
        let showText;
        let h1 = document.querySelector("h1")
        if (h1 && h1.innerText.length >= titleStrs[0].length && document.title.indexOf(h1.innerText.trim()) != -1) {
            showText = h1.innerText
        } else {
            showText = titleStrs[0]
            let panduanT = pattT.test(showText);
            if (panduanT && titleStrs.length > 1) {
                showText = showText + "-" + titleStrs[1]
            }
        }
        // ti.innerHTML = "<h1 wenwen='title'><img wenwen='title'></img>" + showText + "</h1>";
        ti.innerHTML = "<h1 wenwen='title'></h1>";;
        ti.firstElementChild.innerText = showText;
        // }
        // else {
        // ti.innerHTML = "<h1 wenwen='title'><img wenwen='title'></img>" + document.title + "</h1>";
        // }

        let img = document.createElement("img");
        ti.firstElementChild.prepend(img)
            //https://favicon.yandex.net/favicon/v2/https://blog.csdn.net/Altaba/article/details/78539752?size=32
        let url = window.location.host;
        let iconurl = "https://favicon.yandex.net/favicon/v2/https://" + url + "?size=32";
        // 添加属性
        img.setAttribute('src', iconurl);
        img.setAttribute("wenwen", "title")

    }

    function getSiteInfo() {
        let siteName
            // 应用全部网站
        if (SITE_SETTINGS[location.hostname]) {
            siteName = location.hostname
        } else {
            const match = location.href.match(
                /([\d\w]+)\.(com|cn|net|org|im|io|cc|site|tv)/i
            )
            siteName = match ? match[1] : null
        }
        return {
            siteName,
            siteSetting: SITE_SETTINGS["def"],
        }
        // }
    }

    function getPageTocOptions() {
        let siteInfo = getSiteInfo()
        if (siteInfo) {
            if (typeof siteInfo.siteSetting === 'function') {
                return siteInfo.siteSetting()
            }

            let siteSetting = {
                ...siteInfo.siteSetting
            }
            if (siteSetting.shouldShow && !siteSetting.shouldShow()) {
                return
            }
            if (typeof siteSetting.contentSelector === 'function') {
                const contentSelector = siteSetting.contentSelector()
                if (!contentSelector) return
                siteSetting = {
                    ...siteSetting,
                    contentSelector
                }
            }
            if (typeof siteSetting.scrollSmoothOffset === 'function') {
                siteSetting.scrollSmoothOffset = siteSetting.scrollSmoothOffset()
            }

            console.log('[toc-bar] found site info for', siteInfo.siteName)
            return siteSetting
        }
    }

    function guessThemeColor() {
        const meta = document.head.querySelector('meta[name="theme-color"]')
        if (meta) {
            return meta.getAttribute('content')
        }
    }

    /**
     * @param {String} content
     * @return {String}
     */
    function doContentHash(content) {
        const val = content.split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
        return val.toString(32)
    }

    const POSITION_STORAGE = {
        cache: null,
        checkCache() {
            if (!POSITION_STORAGE.cache) {
                POSITION_STORAGE.cache = GM_getValue('tocbar-positions', {})
            }
        },
        get(k) {
            k = k || location.host
            POSITION_STORAGE.checkCache()
            return POSITION_STORAGE.cache[k]
        },
        set(k, position) {
            k = k || location.host
            POSITION_STORAGE.checkCache()
            POSITION_STORAGE.cache[k] = position
            GM_setValue('tocbar-positions', POSITION_STORAGE.cache)
        },
    }

    function isEmpty(input) {
        if (input) {
            return Object.keys(input).length === 0
        }
        return true
    }

    /** 宽度，也用于计算拖动时的最小 right */
    const TOC_BAR_WIDTH = 340

    // ---------------- TocBar ----------------------
    const TOC_BAR_STYLE = `
    .toc-bar {
    --toc-bar-active-color: #54BC4B;
    background-color: #d7ccc8 !important;
    position: fixed;
    z-index: 9999999999;
    right: 5px;
    top: 80px;

    width: ${TOC_BAR_WIDTH}px;
    font-size: 14px;
    box-sizing: border-box;
    padding: 0 10px 10px 0;
    box-shadow: 0 1px 3px #DDD;
    border-radius: 4px;
    transition: width 0.2s ease;
    color: #333;
    background: #FEFEFE;

    user-select:none;
    -moz-user-select:none;
    -webkit-user-select: none;
    -ms-user-select: none;
    }

    .toc-bar.toc-bar--collapsed {
    width: 30px;
    height: 30px;
    padding: 0;
    overflow: hidden;
    }

    .toc-bar--collapsed .toc {
    display: none;
    }

    .toc-bar--collapsed .hidden-when-collapsed {
    display: none;
    }

    .toc-bar__header .shang {
    font-weight: bold;
    padding-bottom: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;
    }

    .toc-bar__refresh {
    position: relative;
    top: -2px;
    }

    .toc-bar__refresh svg {
    background-color: #4caf50 !important;
    }

    .toc-bar__icon-btn {
    height: 1em;
    width: 1em;
    cursor: pointer;
    transition: transform 0.2s ease;
    }

    .toc-bar__icon-btn:hover {
    opacity: 0.7;
    }

    .toc-bar__icon-btn svg {
    max-width: 100%;
    max-height: 100%;
    vertical-align: top;
    }

    .toc-bar__header-left {
    align-items: center;
    }

    .toc-bar__toggle {
    cursor: pointer;
    padding: 8px 8px;
    box-sizing: content-box;
    transition: transform 0.2s ease;
    }

    .toc-bar__title {
    margin-left: 5px;
    font-weight: 700
    }

    .toc-bar a.toc-link {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    line-height: 1.6;
    }

    .flex {
    display: flex;
    }

    /* tocbot related */
    .toc-bar__toc {
    max-height: 80vh;
    overflow-y: auto;
    }

    .toc-list-item>a:hover {
    text-decoration: underline;
    }

    .toc-list {
    padding-inline-start: 0;
    }

    .toc-bar__toc>.toc-list {
    margin: 0;
    overflow: hidden;
    position: relative;
    padding-left: 5px;
    }

    .toc-bar__toc>.toc-list li {
    list-style: none;
    padding-left: 8px;
    position: static;
    }

    a.toc-link {
    color: currentColor;
    height: 100%;
    }

    .is-collapsible {
    max-height: 1000px;
    overflow: hidden;
    transition: all 300ms ease-in-out;
    }

    .is-collapsed {
    max-height: 0;
    }

    .is-position-fixed {
    position: fixed !important;
    top: 0;
    }

    .toc-link::before {
    background-color: #EEE;
    content: ' ';
    display: inline-block;
    height: inherit;
    left: 0;
    margin-top: -1px;
    position: absolute;
    width: 2px;
    }

    #toc-bar {
    z-index: 9999999999 !important;
    padding-bottom: 10px;
    }

    .toc-bar {
    padding: 0px;
    }

    .toc-bar__header{
    }

    .toc-bar__header .shang {
    background-color: #4caf50 !important;
    }

    .toc-bar__actions.hidden-when-collapsed {
    margin-right: 8px;
    }

    a.toc-link {
    font-weight: 700;
    font-style: normal;
    background-color: #d7ccc8 !important;
    border: 0px;
    font-size: 17px !important;
    font-family: consoals
    }

    .toc-link::before {
    background-color: #d7ccc8;
    content: ' ';
    display: inline-block;
    height: inherit;
    left: 0;
    margin-top: -1px;
    position: absolute;
    width: 4px;
    }

    .is-active-link {
    font-weight: 700;
    background-color: #fff59d !important;
    border: 2px solid red !important;
    font-weight: 700;
    }



    .is-active-link::before {
    background-color: #4caf50 !important;
    /* background-color: let(--toc-bar-active-color);*/
    }

    .toc-bar__toc {
    /* padding-left: 10px; */
    }

    .toc-list-item {
    padding-left: 0 !important;
    }

    a.toc-link.node-name--H1,
    .toc-level-h1 a,
    h1 {
    color: blue !important;
    /* margin-left: 0px; */
    font-weight: 700;
    }

    a.toc-link.node-name--H2,
    .toc-level-h2 a,
    h2 {
    color: blueviolet !important;
    margin-left: 10px;
    font-weight: 700;
    }

    a.toc-link.node-name--H3,
    .toc-level-h3 a,
    h3 {
    color: brown !important;
    margin-left: 20px;
    font-weight: 700;
    }

    a.toc-link.node-name--H4,
    .toc-level-h4 a,
    .node-name--P,
    h4 {
    color: #d78906 !important;
    margin-left: 30px;
    font-weight: 700;
    }

    a.toc-link.node-name--H5 {
    color: #35684e !important;
    margin-left: 40px;
    font-weight: 700;
    }

    a.toc-link:not([class*='H']) {
    margin-left: 50px;
    font-weight: 700;
    }

    [head],[head2],
    .h3 {
    margin-left: 0 !important;
    padding-left: 0 !important;
    /* 锚点偏移 */
    /* 
    margin-top: -60px !important;
    padding-top: 60px !important;
    */
    background-color: rgb(0, 0, 0, 0) !important;
    }

    /* 文章标题 */
    div[wenwen*='title'] {
    position: fixed;
    top: 0;
    left: 0;
    font-size: 22px;
    z-index: 9998;
    padding: 5px 0px;
    background-color: #c5e0b3;
    width: 100%;
    color: blue;
    border-bottom: 1px solid green;
    }

    h1[wenwen*='title'] {
    font-size: 22px;
    margin: 0;
    color: blue !important;
    display: flex;
    align-items: center;
    margin-left: 100px;
    text-indent: 0 !important;
    }



    img[wenwen*="title"] {
    height: 20px !important;
    width: 20px !important;
    /* float: left !important; */
    margin: 0 5px 0 0 !important;
    }

    /* toc样式 */
    .toc-bar__toc * {
    background-color: #d7ccc8 !important;
    }

    .shang * {
    background-color: inherit !important;
    }

    .toc-bar__header-left button {
    margin-left: 16px;
    height: 20px;
    width: 40px;
    cursor: pointer !important
    }

    #toc-bar .but {
    cursor: pointer !important;
    height: 20px;
    width: 50px;
    padding: 2px !important;
    word-break: normal !important;
    font-weight: 700;
    text-align: center;
    line-height: 20px;
    margin-left: 135px;
    }

    #toc-bar #butM {
    color: #81c784 !important;
    background-color: #33691e !important;
    }

    #toc-bar #butL {
    color: #33691e !important;
    background-color: #81c784 !important;
    }

    .toc-list {
    margin: 0;
    }

    /* 文字可选可复制 */
    [mainDiv] *{
        user-select:text
    }

    /* 目标锚点高亮 */
    [here]{
        border-bottom: 2px solid yellow!important;
    }


    `


    const TOCBOT_CONTAINTER_CLASS = 'toc-bar__toc'

    /**
     * @class
     */
    function TocBar(options = {}) {
        this.options = options

        this.element = document.createElement('div')
        this.element.id = 'toc-bar'
        this.element.classList.add('toc-bar')
        document.body.appendChild(this.element)

        /** @type {Boolean} */
        this.visible = true

        this.initHeader()

        // create a container tocbot
        const tocElement = document.createElement('div')
        this.tocElement = tocElement
        tocElement.classList.add(TOCBOT_CONTAINTER_CLASS)
        this.element.appendChild(tocElement)

        const cachedPosition = POSITION_STORAGE.get(options.siteName)
        if (!isEmpty(cachedPosition)) {
            this.element.style.top = `${Math.max(0, cachedPosition.top)}px`
            this.element.style.right = `${cachedPosition.right}px`
        } else if (options.hasOwnProperty('initialTop')) {
            this.element.style.top = `${options.initialTop}px`
        }

        if (GM_getValue('tocbar-hidden', false)) {
            this.toggle(false)
        }
    }

    const REFRESH_ICON = `<svg t="1593614403764" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5002" width="200" height="200"><path d="M918 702.8 918 702.8c45.6-98.8 52-206 26-303.6-30-112.4-104-212.8-211.6-273.6L780 23.2l-270.8 70.8 121.2 252.4 50-107.6c72.8 44.4 122.8 114.4 144 192.8 18.8 70.8 14.4 147.6-18.8 219.6-42 91.2-120.8 153.6-210.8 177.6-13.2 3.6-26.4 6-39.6 8l56 115.6c5.2-1.2 10.4-2.4 16-4C750.8 915.2 860 828.8 918 702.8L918 702.8M343.2 793.2c-74-44.4-124.8-114.8-146-194-18.8-70.8-14.4-147.6 18.8-219.6 42-91.2 120.8-153.6 210.8-177.6 14.8-4 30-6.8 45.6-8.8l-55.6-116c-7.2 1.6-14.8 3.2-22 5.2-124 33.2-233.6 119.6-291.2 245.6-45.6 98.8-52 206-26 303.2l0 0.4c30.4 113.2 105.2 214 213.6 274.8l-45.2 98 270.4-72-122-252L343.2 793.2 343.2 793.2M343.2 793.2 343.2 793.2z" p-id="5003"></path></svg>`

    const TOC_ICON = `
    <?xml version="1.0" encoding="utf-8"?>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    viewBox="0 0 1024 1024" style="enable-background:new 0 0 1024 1024;" xml:space="preserve">
    <g>
    <g>
    <path d="M835.2,45.9H105.2v166.8l93.2,61.5h115.8H356h30.6v-82.8H134.2v-24.9h286.2v107.6h32.2V141.6H134.2V118h672.1v23.6H486.4
    v132.5h32V166.5h287.8v24.9H553.8v82.8h114.1H693h225.6V114.5L835.2,45.9z M806.2,93.2H134.2V67.2h672.1v26.1H806.2z"/>
    <polygon points="449.3,1008.2 668,1008.2 668,268.9 553.8,268.9 553.8,925.4 518.4,925.4 518.4,268.9 486.4,268.9 486.4,925.4
    452.6,925.4 452.6,268.9 420.4,268.9 420.4,925.4 386.6,925.4 386.6,268.9 356,268.9 356,946.7 "/>
    </g>
    </g>
    </svg>
    `

    // const wentitle = document.title;

    TocBar.prototype = {
        /**
         * @method TocBar
         */
        initHeader() {
            const header = document.createElement('div')
            header.classList.add('toc-bar__header')
            header.innerHTML = `
                <div class="shang">
                <div class="flex toc-bar__header-left">
                <div class="toc-bar__toggle toc-bar__icon-btn" title="Toggle TOC Bar">
                ${TOC_ICON}
                </div>
                <div class="toc-bar__title hidden-when-collapsed">TOC Bar</div>
                <div id="butL" class="but">Less</div>
                <div id="butM" class="but">More</div>
                </div>
                <div class="toc-bar__actions hidden-when-collapsed">
                <div class="toc-bar__refresh toc-bar__icon-btn" title="Refresh TOC">
                ${REFRESH_ICON}
                </div>
                </div>
                </div>
                `

            // style.innerText = "body[wenwen] :not([wenwen]){opacity: 0.5;} [wenwen*='parents'],:not([wenwen]){ background-color: #c5e0b3!important; }";

            // let wenLeft = wenzhangzhuti.getBoundingClientRect().left;
            // let wenTop = Math.abs(wenzhangzhuti.getBoundingClientRect().top - document.body.getBoundingClientRect().top);


            GM_setValue("tocbar-hidden", false);
            const toggleElement = header.querySelector('.toc-bar__toggle')
            toggleElement.addEventListener('click', () => {
                this.toggle()
                GM_setValue('tocbar-hidden', !this.visible)
            })
            this.logoSvg = toggleElement.querySelector('svg')

            const refreshElement = header.querySelector('.toc-bar__refresh')


            // 刷新
            refreshElement.addEventListener('click', () => {
                document.querySelector("[wenwen*='title']").remove()
                document.querySelector("#toc-bar").remove()
                document.querySelector("[tocstyle]").remove()
                document.querySelector("[bodystyle]").remove()

                // 添加的标题要还原
                let appends = document.querySelectorAll("[head*='append']")
                if (appends.length) {
                    for (const iterator of appends) {
                        iterator.parentElement.innerText = iterator.innerText
                    }
                }

                // let attrs = document.querySelectorAll("[wenwen],[Ex],[head],[head2],[about],[myattr]")
                let attrList = ["wenwen", "Ex", "head", "head2", "about", "myattr"]
                for (const attr of attrList) {
                    let eles = document.querySelectorAll("[" + attr + "]")
                    if (eles.length) {
                        for (const iterator of eles) {
                            iterator.removeAttribute(attr)
                            if ((attr == "head" || attr == "head2") && iterator.getAttribute("id")) {
                                iterator.removeAttribute("id")
                            }
                        }
                    }
                }

                // 代码高亮刷新
                if (!document.querySelector("[iscode]")) {
                    document.querySelector("[codestyle]").remove()
                    document.querySelector("[defstyle]").remove()
                    document.querySelector("[backstyle]").remove()
                    CodeHL()
                }

                mainFuc();
            })

            // for (let i = 0; i < notes.length; i++) {
            // notes[i].addEventListener('click', () => {
            // tocbot.refresh()
            // })
            // }


            // ---------------- header drag ----------------------
            const dragState = {
                startMouseX: 0,
                startMouseY: 0,
                startPositionX: 0,
                startPositionY: 0,
                startElementDisToRight: 0,
                isDragging: false,
                curRight: 0,
                curTop: 0,
            }

            const onMouseMove = (e) => {
                if (!dragState.isDragging) return
                const deltaX = e.pageX - dragState.startMouseX
                const deltaY = e.pageY - dragState.startMouseY
                    // 要换算为 right 数字
                const newRight = Math.max(30 - TOC_BAR_WIDTH, dragState.startElementDisToRight - deltaX)
                const newTop = Math.max(0, dragState.startPositionY + deltaY)
                Object.assign(dragState, {
                        curTop: newTop,
                        curRight: newRight,
                    })
                    // console.table({ newRight, newTop})
                this.element.style.right = `${newRight}px`
                this.element.style.top = `${newTop}px`
            }

            const onMouseUp = (e) => {
                Object.assign(dragState, {
                    isDragging: false,
                })
                document.body.removeEventListener('mousemove', onMouseMove)
                document.body.removeEventListener('mouseup', onMouseUp)

                POSITION_STORAGE.set(this.options.siteName, {
                    top: dragState.curTop,
                    right: dragState.curRight,
                })
            }

            header.addEventListener('mousedown', (e) => {
                    if (e.target === toggleElement) return
                    const bbox = this.element.getBoundingClientRect()
                    Object.assign(dragState, {
                        isDragging: true,
                        startMouseX: e.pageX,
                        startMouseY: e.pageY,
                        startPositionX: bbox.x,
                        startPositionY: bbox.y,
                        startElementDisToRight: document.body.clientWidth - bbox.right,
                    })
                    document.body.addEventListener('mousemove', onMouseMove)
                    document.body.addEventListener('mouseup', onMouseUp)
                })
                // ----------------end header drag -------------------

            this.element.appendChild(header)
        },
        /**
         * @method TocBar
         */
        initTocbot(options) {
            const me = this

            /**
             * records for existing ids to prevent id conflict (when there are headings of same content)
             * @type {Object} {[key: string]: number}
             **/
            this._tocContentCountCache = {}

            const tocbotOptions = Object.assign({}, {
                        tocSelector: `.${TOCBOT_CONTAINTER_CLASS}`,
                        scrollSmoothOffset: options.scrollSmoothOffset || 0,
                        // hasInnerContainers: true,
                        headingObjectCallback(obj, ele) {
                            // if there is no id on the header element, add one that derived from hash of header title
                            if (!ele.id) {
                                const newId = me.generateHeaderId(obj, ele)
                                ele.setAttribute('id', newId)
                                obj.id = newId
                            }
                            return obj
                        },
                        // 标题选择器xuanze
                        headingSelector: "[head2]:not([Ex]):not([head] [head2],[head2] [head2]),[head]:not([Ex]):not([head] [head])",
                        // headingSelector: "h1:not([Ex]), h2:not([Ex]), h3:not([Ex]), h4:not([Ex]), h5:not([Ex]),.h3,[class*='strong']:not([Ex]),strong:not([Ex]),.bjh-h3,b:not([Ex]),[myAttr='wenzhangdiv']>li:not([Ex])",
                        // headingSelector: "h1, h2:not([Ex]), h3:not([Ex]), h4:not([Ex]), h5,[class*='strong'],.bjh-h3,.h3,font,b",
                        collapseDepth: 6,
                    },
                    options
                )
                // console.log('tocbotOptions', tocbotOptions);
            tocbot.init(tocbotOptions)
        },
        generateHeaderId(obj, ele) {
            const hash = doContentHash(obj.textContent)
            let count = 1
            let resultHash = hash
            if (this._tocContentCountCache[hash]) {
                count = this._tocContentCountCache[hash] + 1
                resultHash = doContentHash(`${hash}-${count}`)
            }
            this._tocContentCountCache[hash] = count
            return `tocbar-${resultHash}`
        },
        /**
         * @method TocBar
         */
        toggle(shouldShow = !this.visible) {
            const HIDDEN_CLASS = 'toc-bar--collapsed'
            const LOGO_HIDDEN_CLASS = 'toc-logo--collapsed'
            if (shouldShow) {
                this.element.classList.remove(HIDDEN_CLASS)
                this.logoSvg && this.logoSvg.classList.remove(LOGO_HIDDEN_CLASS)
            } else {
                this.element.classList.add(HIDDEN_CLASS)
                this.logoSvg && this.logoSvg.classList.add(LOGO_HIDDEN_CLASS)

                const right = parseInt(this.element.style.right)
                if (right && right < 0) {
                    this.element.style.right = "0px"
                    const cachedPosition = POSITION_STORAGE.cache
                    if (!isEmpty(cachedPosition)) {
                        POSITION_STORAGE.set(null, {
                            ...cachedPosition,
                            right: 0
                        })
                    }
                }
            }
            this.visible = shouldShow
        },
        refreshStyle() {
            const themeColor = guessThemeColor()
            if (themeColor) {
                this.element.style.setProperty('--toc-bar-active-color', themeColor);
            }
        },
    }

    // 设置导航跳转
    function Navigation() {
        // 仅限于本页跳转
        let lias = document.querySelectorAll("#toc-bar a")
        for (const iterator of lias) {
            iterator.setAttribute('target', "_self")
        }

        // 解决锚点偏移
        $('#toc-bar a').click(function() {
            let here = document.querySelector("[here]");
            if (here) {
                here.removeAttribute("here")
            }
            let target = $(this).attr('href'); // target获取的是a标签里的链接
            $('html, body').animate({
                scrollTop: $(target).offset().top - 60 //60为设置的偏移值
            }, 300);
            document.querySelector(target).setAttribute("here", "here")
            return false;
        });
    }


    // toc样式控制
    function tocControl() {
        let butM = document.querySelector("#butM");
        // let but2 = header.querySelector("#but2");
        let butL = document.querySelector("#butL");

        // bodystyle
        let style = document.createElement('style');
        style.setAttribute("bodystyle", "tttt");
        document.head.appendChild(style);

        // tocstyle
        let style2 = document.createElement('style');
        style2.setAttribute("tocstyle", "tttt");
        document.head.appendChild(style2);

        // let wenzhangzhuti = document.querySelector("[myattr]");
        let wenH = wenzhangzhuti.clientHeight + 300

        let bodystyle = `
                :not([myAttr], [myAttr] *, #toc-bar, #toc-bar *, [wenwen], [id^='pv-'], [id^='pv-'] *, [class^='pv-'], [class^='pv-'] *, [id='stylebot'], [id='stylebot'] *, .simpread-read-root, .simpread-read-root *) {
                    display: none !important;
                }
    
                /* 文章主体样式 max-width: 800px !important;background-color: #c5e0b3 !important;*/
                [myattr] {
                box-sizing:border-box!important;
                padding: 40px!important;
                height: auto !important;
                margin:0!important;
                box-shadow: 0px 0px 30px gray;
                background: none;
                overflow: visible !important;
                width: 800px !important;
                position: absolute !important;
                top: 100px !important;
                left: 80px !important;
                margin-bottom: 200px !important
                }
    
                [myAttr] a {
                    color: #135888!important;
                }
    
                [wenwen*='parents'] {
                    width: 100vw !important;
                    max-width: 100vw !important;
                    overflow: visible !important;
                    box-shadow: none !important;
                    display: block !important;
                    position: absolute !important;
                    left: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    margin-left: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    background: none !important;
                    background-color: #d4e6bb !important;
                    height: ${wenH}px !important
                }
    
                /* 终选展开全文 */
                [myattr] div[show]:not(#toc-bar,#toc-bar *){
                    overflow: visible!important;
                    height: auto!important;
                    display: block!important;
                }
    
                #butL {
                    display: none
                }
    
                
                /* 去广告 , 推荐，评论区*/
                a[href*='/'] img,[about],div#comments,div.comments{
                    display:none!important;
                }
    
    
                `;

        //    .hidden-when-collapsed,
        let tocstyle = `
                .toc-bar__toggle,    
                .toc-bar__title,
                .toc-bar__toc {
                    display: none;
                }
    
                #toc-bar .shang{
                    padding: 5px 0 5px 5px!important;
                }
    
                #toc-bar .but {
                    margin-left: 0!important;
                }
    
                #toc-bar {
                    padding: 0 !important;
                    width: 120px;
                }
    
                .shang {
                    padding-bottom: 0 !important
                }
    
                #toc-bar * {
                    border-radius: 4px !important;
                }
    
                .toc-bar__header {
                    margin: 0 !important
                }
                `

        // bodystyle初始化样式 默认隐藏
        style.innerText = bodystyle


        // tocstyle样式默认跟随上面设定的样式
        style2.innerText = `
    
                `
            // p标签内容长度
            // ("p:not(ul p,a p,p[class],p[id],header p,footer p,p p)");
        let theps = document.querySelectorAll("[myattr='wenzhangdiv'] p:not(ul p,a p,p[class],p[id],header p,footer p,p p,[id*='comment'] p,[class*='comment'] p)")
        if (!theps.length) {
            theps = document.querySelectorAll("[myattr='wenzhangdiv']>p:not(p[class],p[id])")
        }
        let strLength = 0;
        if (theps.length) {
            for (const iterator of theps) {
                strLength = iterator.innerText.length + strLength
            }
        }


        // 无标题或article模块，则收窄且显示全部
        // tocstyle收窄样式，覆盖默认
        // if (hasOption == false) {
        //     style2.innerText = tocstyle;
        // }
        // if (hasOption == false) {
        //     style2.innerText = tocstyle
        // }


        // 以下情况覆盖style和style2，收窄且显示全部
        // 标记该情况
        let example1 = false;
        // let precode = document.querySelectorAll("pre code");

        if (!hasAtr && document.body.querySelectorAll("article:not(li article)").length != 1 && (!bodycodenum || strLength < 200 || document.querySelectorAll("[myattr='wenzhangdiv'] p:not(ol p,ul p,a p,p[class],p[id])").length == 0)) {
            example1 = true;
            style2.innerText = tocstyle
            style.innerText = `
                    #butM,[wenwen='title']{
                        display:none
                    }
                    `
            console.log("example1");
        }

        // 标题总和
        // let titles = document.querySelectorAll("[myattr] :is([head2]:not([Ex]):not([head] [head2],[head2] [head2],li [head2]),[head]:not([Ex]):not([head] [head],li [head]))")
        let titles = document.querySelectorAll("[head2]:not([Ex]):not([head] [head2],[head2] [head2]),[head]:not([Ex]):not([head] [head])")

        if (!titles.length) {
            style2.innerText = tocstyle
        }

        // 确认有文章特征
        // 标记该情况 && titles.length > 0
        let example2 = false;
        if (strLength > 200 || bodycodenum || hasAtr) {
            hasOption == true
            example1 = false;
            example2 = true;
            style.innerText = bodystyle
            style2.innerText = ``
            if (titles.length == 0) {
                style2.innerText = tocstyle
            }
            console.log("篇幅过长");
        }

        console.log("文章高度: " + wenzhangzhuti.offsetHeight + "\nstrLength字数: " + strLength + "\nhasAtr: " + hasAtr + "\nbodycodenum: " + bodycodenum);

        butM.onclick = function() {
            // 收窄
            // if (example1 || (!example2 && !hasOption)) {
            style2.innerText = tocstyle
                // } else {
                //     style2.innerText = `

            //     `
            // }

            style.innerText = `
                    #butM,[wenwen='title']{
                        display:none
                    }
                    `
        }

        butL.onclick = function() {

            // 宽松收窄
            if (titles.length == 0) {
                style2.innerText = tocstyle
            } else {
                style2.innerText = `
    
                    `
            }

            style.innerText = bodystyle;

        }
    }

    // 功能：代码高亮
    function CodeHL() {
        let ols = document.querySelectorAll("ol")
        for (const iterator of ols) {
            if (iterator.querySelector("span[style*=color]") && iterator.offsetHeight < iterator.querySelectorAll("li").length * 30 + 100) {
                iterator.setAttribute("highlight", "highlight")
            }
        }
        // 寻找代码块
        //var codes = document.getElementsByTagName("pre");
        var codes = document.querySelectorAll(":is(pre,[class*='code']:not([class*='qr'],[class*='Qr'],[class*='QR']),[id*='code']:not([id*='qr'],[id*='Qr'],[id*='QR']),[highlight]):not(:is(pre,[class*='code'],[id*='code']) *)");

        // var code = document.querySelector("pre");
        // console.log("复制代码块");
        // if(code.firstElementChild.tagName=="CODE"){
        // codes=document.querySelectorAll("code")
        // }

        // console.log("代码块:" + codes);
        if (codes.length < 0) {
            console.log("无代码块");
        }

        // 标记是否要染色
        let color;

        // 添加js可控样式
        var stylel = document.createElement('style');
        stylel.setAttribute("codestyle", "tttt")
        document.head.appendChild(stylel);

        // 其他样式
        // 背景样式(依情况而定有无内容)
        var styleb = document.createElement('style');
        styleb.setAttribute("backstyle", "tttt")
        document.head.appendChild(styleb);



        // 鼠标悬浮样式
        // sheet.addRule(' .Copybutton :hover ', 'opacity: 1; cursor:pointer; background-color: white;');

        // // 添加高亮脚本
        // var script = document.createElement('script');
        // script.setAttribute('src', 'https://apps.bdimg.com/libs/highlight.js/9.1.0/highlight.min.js');
        // document.head.appendChild(script);

        // }
        for (const i of codes) {

            if (i.clientWidth > 400 && i.innerText.length > 0 && /[a-zA-Z#\/\-]/.test(i.innerText)) {

                // 是否是二维码
                var codeimg = i.querySelectorAll("img")
                if (codeimg.length == 1 && codeimg[0].offsetHeight > 40) {
                    continue;
                }

                // 是否有行号？
                var num = i.querySelector(".pre-numbering")
                if (num) {
                    num.remove();
                }
                var num2 = i.querySelector(".gutter")
                if (num2) {
                    num2.remove();
                }


                //是否有复制按钮
                var copy = i.querySelector(".copy-code-btn")
                if (copy) {
                    copy.remove();
                }

                // 是否有杂乱元素
                // var varia = i.querySelectorAll(":not(pre,code,span,p)")
                // if (varia.length) {
                // for (const iterator of varia) {
                // iterator.remove();
                // }
                // }


                // 筛选通过，设置属性
                i.setAttribute("isCode", "isCode")


                if (i.tagName == "PRE") {
                    if (!i.firstElementChild || (i.firstElementChild && i.firstElementChild.tagName != "CODE")) {
                        // continue;   
                        i.innerHTML = "<code>" + i.innerHTML + "</code>";
                    }
                } else {
                    i.innerHTML = "<pre><code>" + i.innerHTML + "</code></pre>";
                }

                // let codes = i.querySelectorAll("code")
                // let code = i.querySelector("code")

                // 最里面的code
                let precodes = i.querySelectorAll("code")
                let codeL = precodes[precodes.length - 1]
                if (precodes.length > 2) {
                    codeL = i.querySelector("code")
                }
                codeL.setAttribute("innercode", "")

                // var codeC = i.firstChild;

                // 创建代码工具容器元素
                let abc = document.createElement("abc");
                // 创建复制按钮
                let btnC = document.createElement("btn-c");
                // 创建全屏显示按钮
                let btnB = document.createElement("btn-b");
                btnB.innerText = "Full"
                let btnE = document.createElement("btn-e");
                btnE.innerText = "Esc"
                btnE.style.display = "none"

                abc.append(btnC);
                abc.append(btnB);
                abc.append(btnE);

                // var precode = i.querySelector("code");


                // 点击全屏
                btnB.onclick = function() {
                        // // 给予属性
                        // i.setAttribute("thisCode", "thisCode")
                        // // 给予父元素属性
                        // $("[thisCode]").parents().each(function () {
                        // this.setAttribute("codeParents", "codeParents")
                        // });

                        btnE.style.display = "block"
                        btnB.style.display = "none"
                            // i.style.paddingTop = "10%"
                            // i.classList.add("isfull")
                        i.setAttribute("class", "isfull")
                        document.querySelector("#toc-bar").style.display = "none";
                        document.querySelector("[wenwen='title']").style.display = "none";


                        stylel.innerText = `
                    :not(.isfull *){
                    top: 200vh!important;
                    }
                
                    html [wenwen*='parents'] {
                    overflow: hidden !important
                    }
                
                    [codeParents]:not(html,body){
                    }
                    `
                            // document.body.style.paddingTop = "100vh";

                        // 监听键盘
                        document.onkeydown = function(event) {
                            var e = event || window.event || arguments.callee.caller.arguments[0];
                            if (e && e.keyCode == 27) { // 按 Esc
                                //要做的事情，退出全屏
                                restore();
                            }
                        }
                    }
                    // 点击退出全屏
                btnE.onclick = function() {
                    restore();
                }

                function restore() {
                    // // 给予父元素属性
                    // $("[thisCode]").parents().each(function () {
                    // this.removeAttribute("codeParents", "codeParents")
                    // });
                    // // 给予属性
                    // i.removeAttribute("thisCode", "thisCode")

                    btnE.style.display = "none"
                    btnB.style.display = "block"
                    i.classList.remove("isfull")
                    document.querySelector("#toc-bar").style.display = "block";
                    document.querySelector("[wenwen='title']").style.display = "block";
                    stylel.innerText = ""
                        // document.body.style.removeProperty("padding-top");
                }


                btnC.innerHTML = "Copy"; //innerText也可以,区别是innerText不会解析html

                btnC.onclick = function() {
                    // alert("点击了按钮");
                    btnC.innerHTML = "";
                    btnB.innerHTML = "";
                    btnE.innerHTML = "";
                    GM_setClipboard(i.innerText);
                    btnC.innerHTML = "OK";
                    btnB.innerHTML = "Full";
                    btnE.innerHTML = "Esc";
                    // setTimeout(function () {
                    // btnC.innerHTML = "OK"
                    // }, 300);

                }

                // <code>
                i.onmouseenter = function() {
                    btnC.style.display = "block";
                    codeL.prepend(abc);
                }

                i.onmouseleave = function() {
                    // btnC.style.display = "none";
                    btnC.innerHTML = "Copy";
                    abc.remove();
                }


                // 染色
                function HiLight(i) {
                    if (!i.querySelector("table")) {

                        color = true;
                        console.log(i);
                        console.log(i.innerText);

                        // let webSiteReg = new RegExp('((http[s]{0,1}|ftp)://[a-zA-Z0-9\\.\\-]+\\.([a-zA-Z]{2,4})(:\\d+)?(/[a-zA-Z0-9\\.\\-~!@#$%^&*+?:_/=<>]*)?)|((www.)|[a-zA-Z0-9\\.\\-]+\\.([a-zA-Z]{2,4})(:\\d+)?(/[a-zA-Z0-9\\.\\-~!@#$%^&*+?:_/=<>]*)?)', 'g');
                        // let wenText = wenzhangzhuti.innerText
                        // wenText = wenText.replace(webSiteReg, "<a href='$1' target='_blank'>$1</a>");


                        // 文本模式
                        // let matchs = undefined;
                        // if (!i.querySelector("[class*='com']")) {

                        // 解决多个换行问题
                        // codeL.innerHTML = codeL.innerHTML.replace(/<br>/g, "\n")
                        let pattern = /\n[ ]{0,}\n/g
                            // if (codeL.innerText.match(pattern)) {
                        codeL.innerText = codeL.innerText.replace(pattern, "\n")
                            // }

                        // 解决注释边界混淆问题
                        // let pattC = /(^(\#|\/\/){1}|([^:'"]\#|[^:'"]\/\/){1})((.){2,})[ ]{0,}/g
                        let pattC = /(^(\#|\/\/){1}|([\s ]\#|[\s ]\/\/){1})((.){2,})[ ]{0,}/g
                        let matchs = codeL.innerText.match(pattC)
                            // codeL.innerHTML = code.innerText.replace(pattC, "<span comment>/*$2*/</span><br>")

                        // 删除位于首位的换行和首尾空格
                        // if (codeL.innerText.indexOf("\n") == 0) {
                        //     codeL.innerText = codeL.innerText.replace(/\n/, "")
                        // }

                        // 清空语言设定
                        for (const iterator of i.querySelectorAll("code")) {
                            iterator.className = ""
                        }

                        if (matchs) {
                            // 若疑似html,含有标签，不篡改innerHtml，只改innerText
                            if (i.innerText.indexOf(">") != -1 && i.innerText.indexOf("<") != -1) {

                                codeL.innerText = codeL.innerText.replace(pattC, "/*placeholder*/")

                                hljs.highlightBlock(i.querySelector("code"))

                                // 还原占位
                                let comSpans = i.querySelectorAll(".hljs-comment")
                                if (comSpans.length < matchs.length) { //失败
                                    i.querySelector("code").innerText = preText
                                    hljs.highlightBlock(i.querySelector("code"))
                                }
                                if (comSpans.length >= matchs.length) {
                                    let index = 0
                                    for (const iterator of comSpans) {
                                        if (iterator.innerText == "/*placeholder*/") {
                                            iterator.innerText = matchs[index]
                                            index++
                                        }
                                        // if (iterator.innerText.indexOf("//www.") == 0) {
                                        //     iterator.className = ""
                                        // }

                                    }
                                }
                            } else { //非html语言，篡改innerhtml
                                // for (const iterator of i.querySelectorAll("code")) {
                                //     iterator.className = "hljs javascript"
                                // }

                                codeL.innerHTML = codeL.innerText.replace(pattC, "<span comment>/* */</span>")

                                hljs.highlightBlock(i.querySelector("code"))

                                // 还原占位
                                let comSpans = i.querySelectorAll("[comment]")
                                if (comSpans.length) {
                                    for (let index = 0; index < comSpans.length; index++) {
                                        comSpans[index].innerText = matchs[index]
                                        comSpans[index].setAttribute("class", "hljs-comment")
                                            // if (comSpans[index].innerText.indexOf("//www.") == 0) {
                                            //     comSpans[index].className = ""
                                            // }
                                    }

                                }
                            }
                        } else {
                            hljs.highlightBlock(i.querySelector("code"))
                        }

                        // 误染还原
                        let rep = /\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
                        let iscomSpans = i.querySelectorAll(".hljs-comment")
                        for (const iterator of iscomSpans) {
                            if (rep.test(iterator.innerText)) {
                                iterator.className = ""
                            }
                        }

                        // 背景
                        i.style.setProperty('background-color', 'black', 'important');
                    }
                }

                // 原代码染色种类
                let SpanClassList = [];
                let colorSpans = i.querySelectorAll("span");
                for (const iterator of colorSpans) {
                    if (SpanClassList.indexOf(iterator.className) == -1 && iterator.className.length) {
                        SpanClassList.push(iterator.className)
                    }
                }


                let coded = false

                // 无染色则代码高亮
                if (SpanClassList.length < 4) {
                    HiLight(i)
                    console.log("无染色则代码高亮");
                    coded = true
                }

                if (!coded) {
                    // console.log("有染色");
                    // 染色粗糙则重染色
                    let code = i.querySelectorAll("code")
                    let codeChilds = code[code.length - 1].childNodes
                    for (const iterator of codeChilds) {
                        if (iterator.nodeName == "#text") {
                            if (iterator.nodeValue.length > 30) {
                                recolorFlag = true
                                HiLight(i)
                                console.log("染色粗糙则重染色");
                                break
                            }

                        } else {
                            if (iterator.innerText.length > 30 && iterator.tagName != "CODE" && iterator.className.indexOf("com") == -1 && iterator.querySelectorAll("span").length == 0) {
                                recolorFlag = true
                                HiLight(i)
                                console.log("染色粗糙则重染色");
                                break
                            }
                        }

                    }
                }


                // 格式化
                function getBeautifyCode(el) {
                    if (!el || !el.innerText) return ''
                    let code = el.innerText || ''
                    let className = el.classList ? el.classList.value || '' : ''
                    if (className.indexOf('html') !== -1) {
                        code = html_beautify(code)
                            // .replace(/</g, '&lt;')
                            // .replace(/>/g, '&gt;')
                    }
                    if (className.indexOf('css') !== -1) {
                        code = css_beautify(code)
                    }
                    if (className.indexOf('javascript') !== -1) {
                        code = js_beautify(code)
                    }

                    return code
                }

                // 如果i的innerText没有换行\n或换行在末尾处，则需要格式化（有注释块则不做格式化）
                let colorCode = i.querySelector("code.hljs")
                if (colorCode && !colorCode.querySelectorAll("[class*='com']").length) {
                    // if (colorCode) {
                    if (colorCode.innerText.length > 200 && (colorCode.innerText.indexOf("\n") >= colorCode.innerText.length / 2 || colorCode.innerText.indexOf("\n") == -1)) {
                        console.log("格式化前");
                        console.log(colorCode.innerText);
                        colorCode.innerText = getBeautifyCode(colorCode)
                        console.log("格式化后");
                        HiLight(i)
                    }
                }

            }


        }
        // 循环结束


        if (color) {
            console.log("添加背景颜色样式");
            styleb.innerText = `

            .isfull code:not(code code){
            background: black!important;
            }
        
            [isCode],
            [isCode] *,
            [myattr] pre *:not(.button),
            [myattr] pre,
            [myattr] code {
            background: none!important;
            background-color: #000000!important;
            }
        `
                // GM_addStyle(styleb)
        }


        // 复制代码默认样式
        var stylem = document.createElement('style');
        stylem.setAttribute("defstyle", "tttt")
        document.head.appendChild(stylem);
        stylem.innerText = `
            pre code button {
            display: none !important;
            }
        
            abc {
            border: 1px;
            margin-bottom: -200px;
            float: right;
            position: relative;
            z-index: 4;
            display: flex;
            flex-direction: row;
            }
        
            btn-c,btn-b,btn-e {
            cursor: pointer;
            padding: 0;
            border: none;
            width: 64px !important;
            height: 35px !important;
            text-align: center;
            color: white;
            font-family: Consolas;
            border-radius: 5px;
            border: 1px solid white;
            line-height: 35px !important;
            background-color: black !important;
            margin-left: 3px;
            /* border: 1px;
            margin-bottom: -200px;
            float: right;
            position: relative;
            z-index: 4; */
            }
        
            btn-c :hover,btn-b :hover,btn-e :hover {
            cursor: pointer;
            color: white !important
            }
        
            .isfull abc {
            position: fixed;
            top: 20px;
            right: 30px;
            }
        
        
            html body .isfull pre{
            max-width: none!important;
            }
        
            .isfull code:not(code code){
            /* height: 90vh;
            width: 90vw; */
            position: fixed!important;
            top: 0!important;
            bottom: 0!important;
            left: 0!important;
            right: 0!important;
            z-index: 9999999!important;
            overflow: auto!important;
            padding: 20px!important;
            }

            body [myattr] .isfull code{
                margin: 0!important
            }
            `;


        // GM_addStyle(style)

    }


    // ----------------end TocBar -------------------

    // 主函数入口
    function mainFuc() {

        // 排除代码编辑器
        let editor = document.querySelectorAll(".CodeMirror")

        if (editor.length == 1) {
            return;
        }
        // inject style
        // GM_addStyle(TOC_BAR_STYLE)
        // $(document).ready(function () {
        // window.onload = function() {

        // 获取wenzhangzhuti
        getWen()

        // 处理标题
        getTitle()

        // 传参
        const options = getPageTocOptions()

        // 生成导航
        if (options) {
            const tocBar = new TocBar(options)
            tocBar.initTocbot(options)
            tocBar.refreshStyle()
        }

        // 处理导航跳转问题
        Navigation()

        // 处理页面链接
        handelLink()

        // 页面简洁处理
        clean()

        // 页面样式控制
        tocControl();

    }

    setTimeout(function() {

        CodeHL()
            // 代码高亮样式
        GM_addStyle(GM_getResourceText("css"));

        mainFuc()

        // 插入样式（只插入一次）
        // inject style
        GM_addStyle(TOC_BAR_STYLE)

    }, 1500);




})()