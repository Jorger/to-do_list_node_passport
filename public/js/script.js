$(function()
{
    //Para los servicios que se consumirán...
    var nomServicios = [
							{
								servicio 	: 	"Trae todas las tareas",
								urlServicio	: 	"getAllTask",
								metodo		: 	"GET"
							},
							{
								servicio 	: 	"Crear una nueva tarea",
								urlServicio	: 	"createTask",
								metodo		: 	"POST"
							},
							{
								servicio 	: 	"Editar una tarea",
								urlServicio	: 	"updateTask",
								metodo		: 	"PUT"
							},
							{
								servicio 	: 	"Eliminar Tarea",
								urlServicio	: 	"deleteTask",
								metodo		: 	"DELETE"
							},
							{
								servicio 	: 	"Trae una sola tarea",
								urlServicio	: 	"getTask",
								metodo		: 	"GET"
							},
                            {
                                servicio 	: 	"Enviar un correo",
								urlServicio	: 	"mail",
								metodo		: 	"POST"
                            }
						];

    var consumeServicios = function(tipo, val, callback)
	{
		var servicio = {
							url 	: nomServicios[tipo - 1].urlServicio,
							metodo	: nomServicios[tipo - 1].metodo,
							datos 	: ""
						};
		if(tipo === 4 || tipo === 5)
		{
			servicio.url += "/" + val;
		}
		else
		{
			servicio.datos = val !== "" ? JSON.stringify(val) : "";
		}
		//Invocar el servicio...
		$.ajax(
		{
			url 		: servicio.url,
			type 		: servicio.metodo,
			data 		: servicio.datos,
			dataType 	: "json",
			contentType: "application/json; charset=utf-8"
		}).done(function(data)
		{
            callback(data);
		}).error(function(request, status, error)
        {
            alert(request.responseText);
            window.location = "/";
		});
	};

    //Para guardar el nombre del usuario...
    var $nomUsuario = $("#titulo").html();
    //Traer los TO-DO creados...
    var todos = [];
	consumeServicios(1, "", function(data){
        todos = data;
        muestraTodos(1, 0);
    });
    //Fin de los servicios consumidos...
    var voice = $(document).recognitionVoice();
    if(voice.support)
    {
        $("#mic").show().click(function(event)
        {
            $(this).addClass('reconoce');
            voice.newRecognition(function(text)
            {
                $("#task").val(text);
                guardaTodo();
                $("#mic").removeClass('reconoce');
            });
        });
    }

    $("#task").keypress(function(event)
    {
        if(event.keyCode === 13)
        {
            guardaTodo();
        }
    });

    var guardaTodo = function()
    {
        //Saber si el text está vacio...
        var $task = $("#task");
        if($task.val().length !== 0)
        {
            var newToDo = {finish : false, task : $task.val()};
            //Guardar en el Backend...
            $task.val("");
            consumeServicios(2, newToDo, function(data){
                todos.push(data);
                muestraTodos(2, todos.length - 1);
            });
        }
    };

    var contenidoTabla = function(data, type)
    {
        if(type === 1)
        {
            return "<tr id = 'td_"+(data.id)+"'>" +
                        "<td width='10%'><center>" +
                            "<input type = 'checkbox' name = 'checkbox' id = 'che_"+(data.id)+"' "+(data.finish ? "checked" : "")+"/>" +
                        "</center></td>" +
                        "<td width='70%'><div id = 'txt_"+(data.id)+"' class = '"+(data.finish ? "terminado" : "")+"'>" + (data.task) + "</div>" +
                        "<span class = 'date'>"+(data.date)+"</span></td>" +
                        "<td width='10%'><center><img src = 'img/trash.png' border = '0' id = 'del_"+(data.id)+"'/></center></td>" +
                        "<td width='10%'><center><img src = 'img/mail.png' border = '0' id = 'mail_"+(data.id)+"'/></center></td>" +
                    "</tr>";
        }
        else
        {
            $("#che_" + data.id).click(function(event) {
                var ind = this.id.split("_")[1];
                accionTodo(ind, 1);
            });

            $("#del_" + data.id).click(function(event) {
                var ind = this.id.split("_")[1];
                accionTodo(ind, 2);
            });

            $("#mail_" + data.id).click(function(event) {
                var ind = this.id.split("_")[1];
                accionTodo(ind, 3);
            });
        }
    };

    //Para listar los trabajos...
    var muestraTodos = function (tipo, index)
    {
        $("#titulo").html($nomUsuario + " ("+(todos.length <= 9 ? "0" + todos.length : todos.length)+")");
        //Para mostrar todos los elementos...
        var $txt = "";
        if(tipo === 1)
        {
            $txt = "<table width='100%' border='0' cellspacing='0' cellpadding='0' id = 'tableTodo'>";
            for(var veces = 1; veces <= 2; veces++)
            {
                for(var i = todos.length - 1; i >= 0; i--)
                {
                    if(veces === 1)
                    {
                        $txt += contenidoTabla(todos[i], 1);
                    }
                    else
                    {
                        contenidoTabla(todos[i], 2);
                    }
                }
                if(veces === 1)
                {
                    $txt += "</table>";
                    $("#todos").html($txt);
                }
            }
        }
        else
        {
            $('#tableTodo').prepend(contenidoTabla(todos[index], 1));
            $("#td_" + todos[index].id).hide().fadeIn('fast');
            contenidoTabla(todos[index], 2);
        }
    };

    var accionTodo = function(ind, type)
    {
        var posInd = buscarIndice(ind);
        if(posInd >= 0)
        {
            if(type === 1)
            {
                todos[posInd].state = $("#che_" + ind).is(':checked');
                var updateData = {
                                    "id"        : ind,
                                    "finish"    : todos[posInd].state,
                                    "field"     : "finish"
                                };
                consumeServicios(3, updateData, function(data)
                {
                    if(todos[posInd].state)
                    {
                        $("#txt_" + ind).addClass('terminado');
                    }
                    else
                    {
                        $("#txt_" + ind).removeClass('terminado');
                    }
                });
            }
            else if(type === 2)
            {
                swal({
                        title: "¿Estás segur@?",
                        text: "¿Deseas eliminar está tarea?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Ok",
                        closeOnConfirm: false
                    },
                    function()
                    {
                        swal({   title: "Eliminado!",   text: "Se ha elimiando la tarea",   timer: 1500,   showConfirmButton: false, type : "success"});
                        consumeServicios(4, ind, function(data)
                        {
                            if(todos.length > 1)
                            {
                                todos.splice(posInd, 1);
                            }
                            else
                            {
                                todos = [];
                            }
                            $("#td_" + ind).fadeOut('slow', function()
                            {
                                $("#titulo").html($nomUsuario + " ("+(todos.length <= 9 ? "0" + todos.length : todos.length)+")");
                                $(this).remove();
                            });
                        });
                    });
            }
            else
            {
                consumeServicios(5, ind, function(data)
                {
                    swal({
                            title: data[0].task,
                            text: "Escribe el correo de la persona con la cual deseas compartir la tarea",
                            type: "input",
                            showCancelButton: true,
                            closeOnConfirm: false,
                            animation: "slide-from-top",
                            inputPlaceholder: "E-mail"
                        },
                        function(inputValue)
                        {
                            if (inputValue === false) return false;
                            if (inputValue === "" || !validaEmail(inputValue))
                            {
                                swal.showInputError("El correo no es válido");
                                return false;
                            }
                            //Para enviar el correo a través del servicio...
                            consumeServicios(6, {"todo"  : data[0].task, "email" : inputValue}, function(data)
                            {
                                if(data.status)
                                {
                                    swal("Nice!", "Se ha enviado el email a: " + inputValue, "success");
                                }
                                else
                                {
                                    swal("Error!", "No se ha podido enviar el email a: " + inputValue, "error");
                                }
                            });
                        });
                });
            }
        }
    };

    var buscarIndice = function(id)
    {
        var ind = -1;
        for(var i = 0; i < todos.length; i++)
        {
            if(todos[i].id === id)
            {
                ind = i;
                break;
            }
        }
        return ind;
    };

    var validaEmail = function(email)
	{
		var emailReg = /^([\da-zA-Z_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/;
        return emailReg.test(email);
	};

    $("#todos").height($(window).height() - 125);
    $(window).resize(function(event) {
        $("#todos").height($(window).height() - 125);
    });
});
