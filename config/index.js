'use strict'
/**
 * 公用配置
 * dev开发环境
 * build 生产环境
 * libraryTarget 模块化规范  1.common 使用nodejs模式开发js业务，2.cmd 使用面向过程传统模式开发js业务
 */

module.exports = {
    isCdn: true,
    isMobile:false,
    backend :false,   // 建立在svn某游戏目录下，如需传给后端人员，请开启为true，省去手动替换html页面中的资源链接
    isTiny:false,      //  开启图片压缩
    port: '8000',
    root:'./',
    dev: './dev',
    dist: './dist/',
    tinyKey: '7NRAuTVZeoFEoelQbxzyNlMYYimlknun',     //  一个tinyKey值每月能压缩500张图片，同一天多次build打包压缩，不累计次数。如果需要自己的key值，请前往 https://tinypng.com/developers申请；查看次数 https://tinypng.com/dashboard/api
    htmlOptions:{
        removeComments: true,               // 清除HTML注释
        collapseWhitespace: true,           // 压缩HTML
        collapseBooleanAttributes: true,    // 省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true,        // 删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,   // 删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,// 删除<style>和<link>的type="text/css"
        minifyJS: true,                     // 压缩页面JS
        minifyCSS: true                     // 压缩页面CSS
    },
    autoprefixerOptions:{
        supportedBrowsers: [
            "> 1%",
            "last 2 versions",
            "firefox >= 28",
            "not ie <= 8",
            'edge >= 12',
            'safari >= 7'
        ],
        cascade: true,
        remove: true
    },
    uglifyOptions:{
        ie8:true
    },
    css: {
        cssSrc: './css/*.css',
        cssDist:  './dist/css',
        cssDistAll:  './dist/css/*.css',
        htmlCss:  '**/*.css'
    },
    js: {
        vendorJsSrc: './lib/*.js',
        appJsSrc: './js/app.js',
        moduleJsSrc: './jsModule/*.js',
        jsDist:  './dist/js',
        jsDistAll:  './dist/js/*.js',
        jsDistExclude:'!./dist/js/vendor-**.js',
        jsDistVendor:'./dist/js/vendor-**.js',
        htmlJs:'**/*.js'
    },
    img:{
        imgRoot:'img/',
        imgSrc:'./img',
        tinyImg:'./img/*.{png,jpg}',
        gifImg:'./img/*.gif',
        cssImg:'../img/*.{gif,png,jpg}',
        icon:'./icon/*.png',
        imgDist: './dist/img',
        htmlImg:'**/*.{gif,png,jpg}',
        imgAll:'./img/*.{png,jpg,gif}'
    },
    sprite:{
        imgName:'sprite.png',
        cssName:'../css/sprite.css',
        imgPath:'../img/sprite.png',
        padding:10
    },
    html:{
        devHtml:'./*.html',
        distHtml:'./dist/*.html',
    },
    json:{
        imgJson:'./dist/img/*.json',
        allJson:'./dist/**/*.json'
    },
    server:{
        proxy: 'localhost',
        index: 'index.html'
    },
    local: {
        img: `//gulp.zq.dev.q1.com/img/`, // 开发环境域名
        css: `//gulp.zq.dev.q1.com/dev/`,
        js: `//gulp.zq.dev.q1.com/dev/`
    },
    cdn: {
        img: `//img.ssl.q1.com/yzsy/zt/gulp/img/`, // 生产环境域名
        css: `//css.ssl.q1.com/yzsy/zt/gulp/css/`,
        js:  `//css.ssl.q1.com/yzsy/zt/gulp/js/`
    }
}
