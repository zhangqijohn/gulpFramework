const gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    htmlmin = require('gulp-htmlmin'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    browserify = require('browserify'),
    stream = require('vinyl-source-stream'),         //  参考文档  https://www.gulpjs.com.cn/docs/recipes/browserify-uglify-sourcemap/
    buffer = require('vinyl-buffer'),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload,
    del = require('del'),
    spritesmith = require('gulp.spritesmith'),
    inject = require('gulp-inject'),
    tinypng = require('gulp-tinypng-compress'),
    cdnizer = require("gulp-cdnizer")

const config = require('./config')
const {root, dev, dist, isCdn, cdn, local, tinyKey, isMobile, htmlOptions, uglifyOptions, autoprefixerOptions, server, port, backend, isTiny} = config
const {vendorJsSrc, appJsSrc, moduleJsSrc, jsDist, jsDistAll, jsDistExclude, jsDistVendor, htmlJs} = config.js
const {cssSrc, cssDist, cssDistAll, htmlCss} = config.css
const {imgSrc, cssImg, icon, tinyImg, imgDist, htmlImg, gifImg, imgAll, imgRoot} = config.img
const {imgName, cssName, imgPath, padding} = config.sprite
const {devHtml, distHtml} = config.html
const {imgJson, allJson} = config.json

gulp.task('devVendorJs', function () {
    return gulp.src(vendorJsSrc)
    .pipe(concat('vendor.js'))
    .pipe(uglify(uglifyOptions))
    .pipe(gulp.dest(dev))
    .pipe(reload({stream: true}))
})
gulp.task('devCss', function () {
    return gulp.src(cssSrc)
    .pipe(plugins.autoprefixer(autoprefixerOptions))
    .pipe(concat('app.css'))
    .pipe(gulp.dest(dev))
    .pipe(reload({stream: true}))
})
gulp.task('devHtml', function () {
    return gulp.src(devHtml)
    .pipe(plugins.if(backend, cdnizer([
            {
                file: htmlJs,
                cdn: local.js + '${ filename }'
            },
            {
                file: htmlCss,
                cdn: local.css + '${ filename }'
            },
            {
                file: htmlImg,
                cdn: local.img + '${ filename }'
            }]
        )
    ))
    .pipe(gulp.dest(root))
    .pipe(reload({stream: true}))
})
gulp.task('devAppJs', function () {
    return browserify({
        entries: appJsSrc,
        debug: true
    })
    .bundle()
    .pipe(stream('main.js'))
    .pipe(buffer())
    .pipe(plugins.sourcemaps.init({loadMaps: true}))
    .pipe(uglify(uglifyOptions))
    .on('error', function (error) {
        console.log(error.toString())
    })
    .pipe(plugins.sourcemaps.write(root))
    .pipe(gulp.dest(dev))
    .pipe(reload({stream: true}))
})
gulp.task('sprite', function () {
    var spriteData = gulp.src(icon)
    .pipe(spritesmith({
        imgName: imgName,
        cssName: cssName,
        imgPath: imgPath,
        padding: padding,
        cssTemplate: (data) => {
            let arr = [],
                width = data.spritesheet.width,
                height = data.spritesheet.height,
                url = data.spritesheet.image,
                unit = 'px'
            if (isMobile) {
                width = width / 100
                height = height / 100
                unit = 'rem'
            }
            arr.push(`.icon {
                        display: inline-block;
                        background: url("${url}") no-repeat;
                        width: ${width}${unit};
                        height: ${height}${unit};
                        background-size:${width}${unit} ${height}${unit};
                    }
                `)
            data.sprites.forEach(function (sprite) {
                let posX = sprite.offset_x,
                    posY = sprite.offset_y,
                    iw = sprite.width,
                    ih = sprite.height
                if (isMobile) {
                    posX = posX / 100
                    posY = posY / 100
                    iw = iw / 100
                    ih = ih / 100
                }
                arr.push(`.i-${sprite.name} {
                            width: ${iw}${unit};
                            height: ${ih}${unit};
                            background-position:${posX}${unit} ${posY}${unit};
                        }
                    `)
            })
            return arr.join('')
        }
    }))
    return spriteData.pipe(gulp.dest(imgSrc))
    .pipe(reload({stream: true}))
})
gulp.task('browser', function () {
    browserSync.init({
        server: server,
        port
    })
    gulp.watch(devHtml).on("change", reload)
    gulp.watch(vendorJsSrc, gulp.series('devVendorJs'))
    gulp.watch(appJsSrc, gulp.series('devAppJs'))
    gulp.watch(moduleJsSrc, gulp.series('devAppJs'))
    gulp.watch(icon, gulp.series('sprite'))
    gulp.watch(cssSrc, gulp.series('devCss'))
})

gulp.task('del', function () {
    return del(dist)
})
gulp.task('buildGif', function () {
    return gulp.src(gifImg)
    .pipe(plugins.rev())
    .pipe(gulp.dest(imgDist))
    .pipe(plugins.rev.manifest())
    .pipe(gulp.dest(imgDist))
})
gulp.task('buildImg', function () {
    let buildImgSrc =imgAll
    if(isTiny){
        buildImgSrc =tinyImg
    }
    return gulp.src(buildImgSrc)
    .pipe(plugins.if(isTiny, tinypng({
            key: tinyKey,
            log: true
        })
    ))
    .pipe(plugins.rev())
    .pipe(gulp.dest(imgDist))
    .pipe(plugins.rev.manifest())
    .pipe(gulp.dest(imgDist))
})
gulp.task('copyHtml', function () {
    return gulp.src(devHtml)
    .pipe(gulp.dest(dist))
})
gulp.task('buildHtml', function () {
    return gulp.src(distHtml)
    .pipe(inject(gulp.src([jsDistAll, cssDistAll, jsDistExclude], {read: false}), {relative: true}))
    .pipe(inject(gulp.src(jsDistVendor, {read: false}), {name: 'vendor', relative: true}))
    .pipe(htmlmin(htmlOptions))
    .pipe(cdnizer([
            {
                file: htmlImg,
                cdn: imgRoot + '${ filename }'
            }]
        )
    )
    .pipe(plugins.if(isCdn, cdnizer([
            {
                file: htmlJs,
                cdn: cdn.js + '${ filename }'
            },
            {
                file: htmlCss,
                cdn: cdn.css + '${ filename }'
            },
            {
                file: htmlImg,
                cdn: cdn.img + '${ filename }'
            }]
        )
    ))
    .pipe(gulp.dest(dist))
})
gulp.task('revHtml', function () {
    return gulp.src([allJson, distHtml])
    .pipe(plugins.revCollector({replaceReved: true}))
    .pipe(gulp.dest(dist))
})
gulp.task('revJs', function () {
    return gulp.src(jsDistAll)
    .pipe(plugins.clean())
    .pipe(plugins.rev())
    .pipe(gulp.dest(jsDist))
    .pipe(plugins.rev.manifest())
    .pipe(gulp.dest(jsDist))
})
gulp.task('revCss', function () {
    return gulp.src([imgJson, cssDistAll])
    .pipe(plugins.revCollector({replaceReved: true}))
    .pipe(gulp.dest(cssDist))
})
gulp.task('buildAppJs', function () {
    return browserify({
        entries: appJsSrc,
        debug: true
    })
    .bundle()
    .pipe(stream('main.js'))
    .pipe(buffer())
    .pipe(uglify(uglifyOptions))
    .on('error', function (error) {
        console.log(error.toString())
    })
    .pipe(gulp.dest(jsDist))
    .pipe(reload({stream: true}))
})

gulp.task('buildCss', function () {
    return gulp.src(cssSrc)
    .pipe(plugins.autoprefixer(autoprefixerOptions))
    .pipe(concat('app.css'))
    .pipe(plugins.if(isCdn, cdnizer([
        {
            file: cssImg,
            cdn: cdn.img + '${ filename }'
        }])
    ))
    .pipe(plugins.cleanCss())
    .pipe(plugins.rev())
    .pipe(gulp.dest(cssDist))
    .pipe(plugins.rev.manifest())
    .pipe(gulp.dest(cssDist))
})
gulp.task('buildVendorJs', function () {
    return gulp.src(vendorJsSrc)
    .pipe(concat('vendor.js'))
    .pipe(uglify(uglifyOptions))
    .pipe(gulp.dest(jsDist))
})
gulp.task('dev', gulp.series('sprite', 'devCss', 'devVendorJs', 'devAppJs', 'devHtml', 'browser'))
gulp.task('build',gulp.series('del', 'buildVendorJs', 'buildAppJs', 'revJs','buildGif', 'buildImg','buildCss', 'revCss', 'copyHtml', 'revHtml', 'buildHtml'))
