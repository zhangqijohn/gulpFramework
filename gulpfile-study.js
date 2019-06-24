var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    htmlmin = require('gulp-htmlmin'),    // html代码压缩
    uglify = require('gulp-uglify'),      //js压缩
    concat = require('gulp-concat'),      //js合并
    browserify = require('browserify'),
    stream = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),      //解决模块化
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload,             //浏览器的热更新
    del = require('del'),      //删除
    spritesmith = require('gulp.spritesmith'), // 雪碧图
    cdnizer = require('gulp-cdnizer'),  //cdn

    tinypng_nokey = require('gulp-tinypng-nokey'),    //压缩图片

    isCdn = false,
    isMobile = false


// 第三方库的引用 dev （gulp-concat，browser-sync，gulp-uglify）
gulp.task('devVendorJs', function () {
    return gulp.src('./dev/*.js')
        .pipe(concat('vendor.js'))    //合并所有js到common.js
        .pipe(uglify())    //压缩
        .pipe(gulp.dest('./js'))  //输出
        .pipe(reload({stream: true}))    //浏览器刷新
})
//  build  （gulp-concat，gulp-uglify）
gulp.task('buildVendorJs', function () {
    return gulp.src('./dist/vendor/*.js')
        .pipe(concat('vendor.js'))    //合并所有js到common.js
        .pipe(uglify())    //压缩
        .pipe(gulp.dest('./dist/js'))  //输出
})

//  css dev（gulp-concat，browser-sync）
gulp.task('devCss', function () {
    return gulp.src('./dev/*.css')
        .pipe(concat('app.css')) //合并css
        .pipe(gulp.dest('./dev'))
        .pipe(reload({stream: true}))
})

//执行build css isCdn （gulp-autoprefixer，gulp-concat，gulp-if，gulp-cdnizer，gulp-clean-css，gulp-rev）
gulp.task('buildCss', function () {
    return gulp.src('./build/css/*.css')
        .pipe(plugins.autoprefixer({
            browsers: ['>1%', 'last 2 versions'], //  兼容浏览器范围
            cascade: true,
            remove: true
        }))
        .pipe(concat('app.css')) //合并css

        .pipe(plugins.if(!isCdn, cdnizer({
                defaultCDNBase: '../',
                //relativeRoot: 'css',
                files: ['**/*.{gif,png,jpg}']
            })
        ))
        .pipe(plugins.if(isCdn, cdnizer({
                defaultCDNBase: 'http://gulp.zq.dev.q1.com/dist/',
                //relativeRoot: 'css',
                files: ['**/*.{gif,png,jpg}']
            })
        ))
        .pipe(plugins.cleanCss())/*压缩css*/
        .pipe(plugins.rev())
        .pipe(gulp.dest('./dist/css'))
        .pipe(plugins.rev.manifest())
        .pipe(gulp.dest('./dist/css'))
})
// 删除dist （del）
gulp.task('del', function () {
    return del(['dist/**'])
})

// 应用js   （browserify,vinyl-source-stream，vinyl-buffer,gulp-concat,vinyl-buffer，gulp-uglify，browser-sync）
gulp.task('devAppJs', function () {
    // 定义入口文件
    return browserify({
        entries: 'dev/main.js',
        debug: true
    })
    // 转成node readabel stream流，拥有pipe方法（stream流分小片段传输）
        .bundle()
        .on('error', function (error) {
            console.log(error.toString())
        })
        // 转成gulp系的stream流，node系只有content，添加名字
        .pipe(stream('app.js'))
        // 转成二进制的流（二进制方式整体传输）
        .pipe(buffer())
        // 输出
        .pipe(uglify())    //压缩
        .pipe(gulp.dest('./dev/'))
        .pipe(reload({stream: true}));

})
//  build（browserify,vinyl-source-stream，vinyl-buffer,gulp-concat,vinyl-buffer，gulp-uglify）
gulp.task('buildAppJs', function () {
    // 定义入口文件
    return browserify({
        entries: 'dist/js/main.js',
        debug: true
    })
    // 转成node readabel stream流，拥有pipe方法（stream流分小片段传输）
        .bundle()
        .on('error', function (error) {
            console.log(error.toString())
        })
        // 转成gulp系的stream流，node系只有content，添加名字
        .pipe(stream('app.js'))
        // 转成二进制的流（二进制方式整体传输）
        .pipe(buffer())
        // 输出
        .pipe(uglify())    //压缩
        .pipe(gulp.dest('./dist/js'))

})

// 生成雪碧图(gulp.spritesmith)
gulp.task('sprite', function () {
    var spriteData = gulp.src('./icon/*.png')
        .pipe(spritesmith({
            imgName: 'sprite.png', // 生成的雪碧图的名称
            cssName: '../dev/sprite.css', // 生成css文件
            imgPath: '/img/sprite.png', // 指定路径
            padding: 5, // 小图之间的间距, 防止重叠
            // css模板
            cssTemplate: (data) => {
                // data为对象，保存合成前小图和合成打大图的信息包括小图在大图之中的信息
                let arr = [],
                    width = data.spritesheet.width,
                    height = data.spritesheet.height,
                    url = data.spritesheet.image,
                    unit ='px'
                if(isMobile) {
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
`);
                data.sprites.forEach(function (sprite) {

                    let posX = sprite.offset_x,
                     posY = sprite.offset_y,
                     iw = sprite.width,
                     ih = sprite.height
                    if(isMobile) {
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
`);
                });
                return arr.join('');
            }
        }));
    return spriteData.pipe(gulp.dest('./img'))
        .pipe(reload({stream: true}))

})
// 实现浏览器的热更新  (browser-sync,gulp-watch,series)
gulp.task('browser', function () {
    browserSync.init({
        server: {
            //files: ['**'],
            proxy: 'localhost', // 设置本地服务器的地址
            index: 'index.html' // 指定默认打开的文件
        },
        port: 8000  // 指定访问服务器的端口号
    })
    gulp.watch('./*.html').on('change', reload)
    gulp.watch('./dev/*.js', gulp.series('devVendorJs'))
    gulp.watch('./dev/jsModule/*.js', gulp.series('devAppJs'))
    gulp.watch('./icon/*.png', gulp.series('sprite'))
    gulp.watch('./dev/*.css', gulp.series('devCss'))


})
//压缩图片 并生成manifest(gulp-tinypng-nokey,gulp-rev)
// gulp.task('tiny', function () {
//     return gulp.src('./img/*.{png,jpg,gif}')
//         .pipe(tinypng_nokey())
//         .pipe(plugins.rev())
//         .pipe(gulp.dest('dist/img'))
//         .pipe(plugins.rev.manifest())
//         .pipe(gulp.dest('dist/img'))
// })

// 压缩页面html (gulp-htmlmin,gulp-if,gulp-cdnizer)
gulp.task('html', function () {
    var options = {
        removeComments: true,//清除HTML注释
        collapseWhitespace: true,//压缩HTML
        collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
    }
    return gulp.src('./*.html')
        .pipe(htmlmin(options))    //页面压缩
        .pipe(plugins.if(isCdn === true, cdnizer([      // cdn配置
                {
                    file: '**/*.js',
                    cdn: 'http://gulp.zq.dev.q1.com/dist/js/${ filename }'
                },

                {
                    file: '**/*.css',
                    cdn: 'http://gulp.zq.dev.q1.com/dist/css/${ filename }'
                },
                {
                    file: '**/*.{gif,png,jpg}',
                    cdn: "http://gulp.zq.dev.q1.com/dist/img/${ filename }"
                }]
            )
        ))
        .pipe(gulp.dest('dist/'))
})
//  js 生成manifest(gulp-clean,gulp-rev)
gulp.task('revJs', function () {
    return gulp.src('./dist/js/*.js')
        .pipe(plugins.clean())
        .pipe(plugins.rev())
        .pipe(gulp.dest('dist/js'))
        .pipe(plugins.rev.manifest())
        .pipe(gulp.dest('dist/js'))
})

//html revCollector 替换(gulp-rev-collector,)
gulp.task('revHtml', function () {
    return gulp.src(['./dist/**/*.json', './dist/*.html'])
        .pipe(plugins.revCollector({replaceReved: true}))
        .pipe(gulp.dest('dist/')); //html更换css,js文件版本，更改完成之后保存的地址
})
//css revCollector 替换  (gulp-rev-collector,)
gulp.task('revCss', function () {
    return gulp.src(['./dist/img/*.json', './dist/css/*.css']) //- 读取 rev-manifest.json 文件以及需要进行替换的图片
        .pipe(plugins.revCollector({replaceReved: true})) //- 执行文件内图片名的替换
        .pipe(gulp.dest('dist/css')); //- 替换后的文件输出的目录
});

gulp.task('dev', gulp.series('devCss', 'devVendorJs', 'devAppJs', 'sprite', 'browser'))
gulp.task('build', gulp.series('del', 'buildCss', 'buildVendorJs', 'buildAppJs',  'revCss', 'revJs', 'html', 'revHtml'))
