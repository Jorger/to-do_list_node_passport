var bcrypt          = 	require('bcrypt-nodejs'),
    passport 	    = 	require('passport'),
    db   		    = 	require('./database'),
	date 			= 	new Date(),
	fechaActual 	= 	(date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
    db.conectaDatabase();

//Crear un token único relacionado al ID de la tarea...
var guid = function()
{
	function s4()
	{
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

var index = function(req, res)
{
	if(!req.isAuthenticated())
    {
        res.redirect('/login');
    }
    else
    {
        var user = req.user;
		res.render("index", {
			titulo 	:  	"To-Do JADE",
			usuario	:	user[0].nombre
		});
    }
};

var login = function(req, res)
{
	res.render("login", {
		titulo 	:  	"Login To-Do"
	});
};

var loginPost = function (req, res, next)
{
	passport.authenticate('local', {
	successRedirect: '/index',
	failureRedirect: '/login'},
	function(err, user, info)
	{
		if(err)
		{
			return res.render('login', {titulo: 'Login To-Do', error: err.message});
		}
		if(!user)
		{
			return res.render('login', {titulo: 'Login To-Do', error: info.message, usuario : info.usuario});
		}
		return req.logIn(user, function(err)
		{
			if(err)
			{
				return res.render('login', {titulo: 'Login To-Do', error: err.message});
			}
			else
			{
				return res.redirect('/');
			}
		});
	})(req, res, next);
};

var logout = function(req, res)
{
	if(req.isAuthenticated())
	{
		req.logout();
    }
	res.redirect('/login');
}

var registro =  function(req, res)
{
	res.render("registro", {
		titulo 	:  	"Registro To-Do",
		data 	:	[]
	});
};

var registroPost = function(req, res, next)
{
    //Buscar si el nombre de usuario o correo ya existen...
	var data = req.body;
	var sql = "select count(*) as numero from users " +
			   "where usuario = '"+(data.username)+"' or " +
			   		  "email = '"+(data.correo)+"'";
	db.queryMysql(sql, function(err, response)
	{
		if(response[0].numero !== 0)
		{
			res.render('registro', {
									titulo: 'Registro To-Do',
									error: 'Nombre de usuario o correo ya existe',
									data : [data.nombre, data.correo, data.username]
								});
		}
		else
		{
            var password = bcrypt.hashSync(data.password);
			sql = "INSERT INTO users (nombre, usuario, clave, email, fecha) " +
					  "VALUES ('" + data.nombre + "', '" + data.username + "', " +
					  		   "'" + password + "', '"+data.correo+"', '" + fechaActual + "')";
			db.queryMysql(sql, function(err, response)
			{
				if (err || response.affectedRows === 0)
				{
					res.render('registro');
				}
				loginPost(req, res, next);
			});
		}
	});
};

var getAllTask =  function(req, res)
{
	//Traer todos los To-Do's...
	if(req.isAuthenticated())
	{
		db.queryMysql("select * from todos where idusuario = " + req.user[0].idusuario, function(err, data){
			if (err) throw err;
			res.json(data);
		});
	}
	else
	{
		res.status(401).send("Acceso no autorizado");
	}
};

var createTask = function (req, res)
{
	if(req.isAuthenticated())
	{
		crearEditarTarea(req.body, 1, req.user[0].idusuario, function(err, data){
			res.json(data);
		});
	}
	else
	{
		res.status(401).send("Acceso no autorizado");
	}
};

var updateTask = function (req, res)
{
	if(req.isAuthenticated())
	{
        console.log(req.body);
        crearEditarTarea(req.body, 2, req.user[0].idusuario, function(err, data){
			res.json(data);
		});
	}
	else
	{
		res.status(401).send("Acceso no autorizado");
	}
};

var deleteTask = function(req, res)
{
	if(req.isAuthenticated())
	{
		var status = true;
		var sql = "DELETE FROM todos WHERE id = '" + (req.param("id")) + "'";
		db.queryMysql(sql, function(err, response)
		{
			if (err || response.affectedRows === 0)
			{
				status = false;
			}
			res.json({status : status});
		});
	}
	else
	{
		res.status(401).send("Acceso no autorizado");
	}
};

var getTask = function(req, res)
{
	if(req.isAuthenticated())
	{
		var sql = "select task from todos WHERE id = '" + (req.param("id")) + "'";
		db.queryMysql(sql, function(err, response)
		{
			if (err) throw err;
			res.json(response);
		});
	}
	else
	{
		res.status(401).send("Acceso no autorizado");
	}
};

var notFound404 = function(req, res)
{
	res.status(404).send("Página no encontrada :( en el memento");
};

//Crear o edita un usuario...
var crearEditarTarea = function(data, tipo, idusuario, callback)
{
	var sql = "";
	//se esta creando una nueva tarea...
	if(tipo === 1)
	{
		data.id = guid();
		data.date = fechaActual;
		sql = "INSERT INTO todos (id, idusuario, task, date, finish) " +
				  "VALUES ('" + data.id + "', '" + idusuario + "', '" + data.task + "', " +
				  		   "'" + data.date + "', " + data.finish + ")";
	}
	else
	{
		sql = "UPDATE todos SET " + (data.field) + " = " + (data[data.field]) + " " +
			  "WHERE id = '" + (data.id) + "'";
	}
	db.queryMysql(sql, function(err, response){
		if (err) throw err;
		callback(err, data);
	});
};

//Exportar las rutas...
module.exports.index = index;
module.exports.login = login;
module.exports.loginPost = loginPost;
module.exports.logout = logout;
module.exports.registro = registro;
module.exports.registroPost = registroPost;
module.exports.getAllTask = getAllTask;
module.exports.createTask = createTask;
module.exports.updateTask = updateTask;
module.exports.deleteTask = deleteTask;
module.exports.getTask = getTask;
module.exports.notFound404 = notFound404;
