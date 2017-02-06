const exec = require('child_process').exec
, formidable = require('formidable')
, http = require('http')
, fs = require('fs')

const dir = "/var/www/mosaico/";


function upload(req, res){
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {

        var image = files.image
        , image_upload_path_old = image.path
        , image_upload_path_new = './upload/'
        , image_upload_name = image.name
        , image_upload_path_name = image_upload_path_new + image_upload_name;

        if (fs.existsSync(image_upload_path_new)) {
            fs.rename( image_upload_path_old, image_upload_path_name, function (err) {
                if (err) {
                    console.log('Err: ', err);
                    res.end('Erro na hora de mover a imagem!');
                }
                var msg = 'Imagem ' + image_upload_name + ' salva em: ' + image_upload_path_new;
                console.log(msg);
                
                buildMosaico( image_upload_name , (err, response) => {

                    fs.readFile( response , function(err, data) {
                        if (err) throw err;
                        res.writeHead(200, {'Content-Type': 'image/jpeg'});
                        res.end(data);
                    });

                });
            });
        }else {
            fs.mkdir(image_upload_path_new, function (err) {
                if (err) {
                    console.log('Err: ', err);
                    res.end('Erro na hora de criar o diretório!');
                }
                fs.rename(
                    image_upload_path_old,
                    image_upload_path_name,
                    function(err) {
                        var msg = 'Imagem ' + image_upload_name + ' salva em: ' + image_upload_path_new;
                        console.log(msg);
                        buildMosaico( image_upload_name , (err, response) => {

                            fs.readFile( response , function(err, data) {
                                if (err) throw err;
                                res.writeHead(200, {'Content-Type': 'image/jpeg'});
                                res.end(data);
                            });

                        });

                    });
                });
            }
        }
    );
}

function home(res){
    res.end("<html><body><form action='/upload' method='post' enctype='multipart/form-data'><input name='image' type='file'/><input type='submit'></form></body></html>");
}


function prepare(){
    exec('metapixel-prepare -r img/ dist-img/ --width=48 --height=48 ',  (error, stdout, stderr) => {

        if (error !== null) {
            res.end('exec error: ' + error);
        }

        res.end(stdout);

    });
}


function buildMosaico( name , callback ){
    exec('metapixel --metapixel -l dist-img --metric wavelet --search local --distance 4 --cheat 30 --scale 5 \''+dir+'upload/'+name+'\' \''+dir+'upload/'+name+'\' ', (error, stdout, stderr) => {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);

        if (error !== null) {
            console.log('exec error: ' + error);
        }

        callback( false, dir+'upload/'+name );

    });
}

http.createServer( (req, res) => {
    console.log(req.url,req.method);
    if( req.url === "/upload" && req.method === "POST" ){
        upload(req, res);
    }else if( (req.url === "/prepare") && (req.method === "GET") ){
        prepare()
    }else{
        home(res);
    }
}).listen(3001);
