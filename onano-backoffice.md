# Oficina virtual  
  
Plataforma para manejo de negocio en ONANO con un estilo moderno y flat. Sus características serán:  
* El usuario podrá iniciar y cerrar sesión con su correo y contraseña.  
* Existirá sistema de “afiliación” con base al ID de usuario que lo invitó (su patrocinador).  
* Existirán dos roles: socio y cliente preferente.  
* En el formulario de registro debe existir la opción de elegir inscribirse como socio o como cliente preferente.  
* Un cliente preferente puede convertirse en socio comprando la membresía de socio desde la tienda virtual.  
* Un socio debe pagar la membresía de socio en la tienda virtual.  
* Cuando se procese como ‘pagada’ la compra de una membresía, se ejecutará una función que convertirá en socio al usuario (si es que no lo era) y le creará su link de referido (esto aplica en ambos casos ya que un usuario que se registra como socio no tendrá su link de referido hasta que no pague su membresía).  
* Los productos podrán ser comprados desde la tienda virtual.  
* Se repartirán ganancias a la billetera virtual del usuario.  
* El usuario podrá hacer pagos desde billetera o métodos externos (cajeros, tarjetas, etc.).  
* Se podrá solicitar retiros de dinero desde billetera a alguna cuenta bancaria registrada.  
* Los usuarios podrán transferir dinero desde una billetera virtual a la billetera virtual de alguien más.  
* El usuario podrá ver un historial de todas sus ganancias, retiros, órdenes, transferencias y afiliaciones.  
* Se adquirirá puntos de volumen por la compra de productos.  
* Los rangos se irán cumpliendo con base al requisito mínimo de cada uno.  
* Existirán los roles Administrador, Supervisor, Soporte y Usuario.  
* Administrador, Supervisor y Soporte tendrán acceso al Admin Panel pero solo podrán ver algunas funciones según su rol.  
* Un Administrador, Supervisor y Soporte es un usuario pero un Usuario pero un Usuario no es un Soporte, Supervisor o Administrador.  
* Un Usuario es el rol más básico y con el que cuentan todas las cuentas registradas.  
* Un Administrador podrá asignar el rol de Supervisor o Soporte a un Usuario.  
* Un Supervisor podrá asignarle el rol de Soporte a un Usuario.  
  
##Base de datos  
- (por aclarar)  
  
##Menu desktop  
**Dashboard.**  
**Nuevo registro.**  
**Negocio**: tiene submenú (árbol uninivel, detalles de negocio y detalles de comisiones).  
**Awards**: tiene submenú (LP, Bono Promotor, Bono de Viaje/Viaje de liderazgo).  
**Tienda**: tiene submenú (Productos, Mis direcciones, Mis métodos de pago e Historial de órdenes).  
**Billetera**.  
**Herramientas**: tiene submenú (Simulador de ganancias, Papelería, Admin panel solo disponible para is_admin, is_supervisor, is_support), Soporte (sistema de tickets).  
  
##Menu mobile  
**Dashboard**  
**Negocio**: te llevará a árbol uninivel (en la versión mobile de árbol uninivel existirá un botón “•••” en la parte superior a la izquierda del carrito de compras que al hacer clic mostrará el resto de páginas: detalles de negocio y detalles de comisiones).  
**Tienda**: te llevará a la página productos ((en la versión mobile de Productos existirá un botón “•••” en la parte superior a la izquierda del carrito de compras que al hacer clic mostrará el resto de páginas: Mis direcciones, Mis métodos de pago e Historial de órdenes).  
**Awards**: te llevará a la página Bono de viaje (en la versión mobile de Bono de viaje existirá un botón “•••” en la parte superior a la izquierda del carrito de compras que al hacer clic mostrará el resto de páginas: LP y Bono Promotor).  
**Botón •••**: al hacer clic mostrará los siguientes links de abajo hacia arriba: Panel de Admin (solo para los roles soporte, supervisor y administrador), Nuevo registro, Billetera, Herramientas de negocio/Papelería ejecutiva (fichas técnicas, trípticos, folletos, catálogo de productos, lista de precios, etc)., Simulador de ganancias, Soporte.  
  
##Explicación de páginas  
Inicio de sesión con Supabase Auth:  
El usuario se puede autenticar con correo electrónico y contraseña.  
El usuario puede solicitar nueva contraseña en caso de olvidarla.  
El usuario podrá ser bloqueado mediante IP por un Administrador o Supervisor.  
El administrador, supervisor y/o soporte pueden hacerle llegar un reinicio de contraseña al usuario.  
  
Dashboard (con base a estos widgets, se irán incluyendo o eliminado algunos según el tier del usuario)  
El usuario puede ver un resumen de las siguientes secciones: puntos de volumen personales, rango máximo alcanzado, rango actual, requisitos para el próximo rango con una visualización del progreso que lleva sobre los requisitos (volumen personal, volumen grupal, pierna más fuerte con volumen tomado de la pierna, resto de piernas con volumen tomado de cada una), link para compartir y que se puedan registrar como referidos del usuario dueño del enlace. Sección Negocio: TOP Socios (muestra el top 10 de socios en la organización del usuario autenticado con mayor VG acomodados en orden descendente; muestra su primer nombre + primer apellido, su PV y su VG, todo acorde al periodo actual), TOP Reclutadores (muestra el top 10 de socios en la organización del usuario autenticado con mayores inscripciones directamente hechas; muestra su primer nombre + primer apellido y cuántos directos ha registrado en el periodo actual), gráfica de líneas para comisiones anuales generadas (x=meses, y=ingresos), gráfica de líneas de registros totales en la red (x=meses, y=registros de afiliados hechos por toda la organización desde el usuario raíz hasta el último de la organización), gráfica de líneas de primeras compras vs recompras (muestra una gráfica de líneas comparativa de las ordenes que incluyen un paquete de inicio y las ordenes que no incluyen un paquete de inicio).  
  
Registrar nuevo socio  
Debe de haber un formulario de registro de nuevo usuario con texto de quién lo está refiriendo: Sección Información personal: inputs para nombres, apellidos, género, celular, país.  
Sección Registro de sistema: inputs para nombre de usuario, , seleccionar ser socio o cliente preferente, correo electrónico, contraseña, confirmar contraseña, un elemento que muestre la fortaleza de la contraseña, un texto que describa los requisitos de la contraseña (mínimo 8 caracteres, por lo menos 1 mayúscula, por lo menos 1 minúscula, por lo menos 1 número, por lo menos 1 caracter especial).  
  
Negocio > Árbol Uninivel  
Tendrá tarjetas informativas de: uninivel (al hacer clic mostrará una sheet de la cantidad de usuarios por nivel en el árbol uninivel), patrocinio (al hacer clic mostrará una sheet de la cantidad de usuarios por nivel en el árbol de patrocinio), Red total (todos los socios + clientes preferentes en la organización), Activos (número fijo de usuarios activos, o sea que tienen 100 PV o más)  
Segment control con el árbol y el usuario podrá seleccionar qué árbol quiere ver (uninivel o patrocinio).  
El árbol será hecho con d3-chart de react.  
  
Negocio > Detalles de negocio  
Mostrará dos tarjetones: uno para detalles del usuario y otro para detalles de la información de quién registró al usuario autenticado.  
Tendrá sección de reporte de volumen que mostrará el volumen personal, grupal y cuántos puntos requiere el siguiente rango.  
Habrá otra sección llamada Equipo de negocio que tendrá un segmented control con un componente accordion con la cantidad de niveles en donde tiene socios registrados el usuario autenticado en el árbol uninivel y otro con un componente accordion con la cantidad de niveles en donde tiene socios registrados el usuario autenticado en el árbol de patrocinio.  El título de cada accordion debe ser “Nivel, Cantidad total de usuarios, VG total en ese nivel y CVG en ese nivel”. Cuando se haga clic en cada accordion, se abrirá y mostrará cada usuario en ese nivel y mostrará los detalles “Primer nombre + Primero apellido, PV, CV”; esto en cada segmented control de cada árbol. El usuario podrá hacer clic en el nombre de cada uno de los socios y será redirigido a las órdenes con un filtro que solo muestren las órdenes que ese usuario haya hecho para obtener los puntos en ese periodo.  
  
Negocio > Detalles de comisiones  
El usuario verá tarjetones para las ganancias totales del negocio: ganancias del bono de patrocinio + diferencial, ganancias del bono avance de rango, ganancias del bono uninivel + infinito y ganancias del bono match.  
Debe tener otra sección con historial de ingresos usando componente accordion. Cada accordion tendrá como título el nombre del bono (Patrocinio, Diferencial de Patrocinio, Avance de rango, Uninivel, Infinito de Uninivel, Match) y la cantidad total ganada. Cuando se haga clic a cada accordion, se desglozará la información detallada de cada comisión que se suma para obtener el total. Ej.: César Núñez | Nivel 1 | 6% de 100 CV |  $108.00 MXN (este valor será según la divisa del país en el que se registró el usuario). Bryan Núñez | Nivel 2 | 8% de 100 CV |  $144.00 MXN.  
Debe de tener otra sección de Información de negocio que muestre el dinero total en Primeras compras (kits de inicio) de toda la organización, el dinero total en Recompras (no kits de inicio) en toda la organización, dinero total en Bono Promotor de toda la organización.   
Por último, una sección que muestre el total de ingresos por transferencias que hayan llegado a la cuenta.  
  
Negocio > Historial de compras  
Segmented control para elegir: Mis órdenes o Órdenes de la red  
Debe mostrar un historial de las ordenes hechas por el usuario y que se etiqueten entre error, en proceso, cancelado o completado.  
Debe tener otra sección para mostrar las ordenes hechas por la organización del usuario autenticado.  
  
Viaje de liderazgo  
Tendrá un resumen de los LTP obtenidos que mostrará el progreso para el siguiente tier y cuántos puntos te faltan para llegar.  
Tendrá una lista de los puntos obtenidos por cada una de las diferentes maneras de obtener puntos. Estará separado por secciones con el titular de la manera (avance de rango propio, avance de rango de mi red, etc).  
  
Tienda  
Será una e-commerce completa y robusta.  
Tendrá en total las siguientes secciones: Paquetes de Inicio, Últimas novedades, Productos más pedidos, tarjetas informativas para anunciar promociones, Productos por categorías (se irán agregando las categorías existentes en la base de datos y los productos correspondientes a cada categoría).  
Cada producto debe estar en una tarjeta y tendrá su nombre, descripción corta, precio y botón para “Agregar”. Al hacer clic en cada imagen de producto abrirá una sheet del producto con imagen del producto, nombre, precio, ingrediente activo, cantidad, descripción completa y botones dinámicos (si ya está agregado al carrito se podrá reducir o aumentar la cantidad, si no está agregado al carrito se podrá añadir al carrito).  
  
Billetera  
Tendrá la sección de Saldo disponible, tendrá un botón para transferir internamente y otro botón para solicitar comisiones.  
Tendrá la sección “Movimientos recientes” que mostrará con detalle los ingresos, egresos y correcciones (en caso de haber cancelaciones de órdenes y que se tengan que corregir las comisiones). Cada uno de los elementos debe mostrar título del proceso, detalle del proceso, fecha y hora local del usuario, dinero que ingresó/egresó/corrigió y salgo que quedó después del proceso.  
  
Simulador de ganancias  
Ya está diseñada.  
  
Papelería  
Por el momento será una página en blanco.  
  
Admin panel  
Se podrá configurar: cierre de mes por bono, porcentaje de comisiones en cada bono, porcentaje de impuestos por país, tipo de cambio por país respecto al dólar.  
Cierre de mes: se podrá configurar en qué fecha cierra cada bono individualmente.  
Porcentaje de comisiones: se podrá configurar el porcentualmente la ganancia de cada bono y estará seccionado por bonos.  
Sección de Estadísticas: se podrán conocer las estadísticas del negocio como Administrador de la cantidad de usuarios registrados, las órdenes totales hechas, el total de dinero ganado por ventas, el total de dinero comisionado por todos los bonos. Esta sección debe ser lo suficientemente profesional como para la auditoria fiscal y económica del negocio.  
Desde aquí se podrá cambiar de patrocinio de usuarios, colocar a alguien afuera del holding tank, buscar un usuario por nombre y conocer todos sus detalles como de registro, del patrocinador, sus comisiones totales y por cada bono, su billetera y movimientos, sus órdenes y las órdenes de su organización, cuántos LP tiene, cuántos LTP tiene, cuántos bono promotor ha canjeado.  
Desde aquí se podrán crear simulaciones controladas en una red privada para conocer el comportamiento de las ganancias. Se podrá duplicar la organización actual en un sandbox para ejecutar los bonos uno por uno y conocer el porcentaje de ganancia. Además se podrán crear nuevos usuarios en caso de ser necesario con la profundidad deseada. Se podrán asignar compras de productos a cada cuenta dentro de esta sandbox. Se podrá exportar el resultado de todo este sandbox para impresión en PDF.  
  
Soporte  
Por el momento será una página en blanco.  
