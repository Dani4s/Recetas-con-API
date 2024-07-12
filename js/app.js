function iniciarApp() {

    const resultadoDiv = document.getElementById("resultado");
    const modal = new bootstrap.Modal("#modal", {});

    //Nuestro selector html
    const categoriasSelect = document.getElementById("categorias");
    if (categoriasSelect) {
        //Obtenemos categorias
        const urlCategoria = "https://www.themealdb.com/api/json/v1/1/categories.php";
        obtenerInformacion(urlCategoria, "categories", mostrarCategorias);
        categoriasSelect.addEventListener("change", seleccionarCategoria);
    }

    const favoritosDiv = document.querySelector(".favoritos");
    if (favoritosDiv) {
        obtenerFavoritos();
    }

    //Consultamos nuestras APIs y realizamos una operación
    function obtenerInformacion(url, propiedad, operacion) {
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => operacion(resultado[propiedad]));
    }

    //Mostramos nuestras categorias en el HTML
    function mostrarCategorias(categorias) {
        categorias.forEach(categoria => {
            const option = document.createElement("option");
            option.value = option.textContent = categoria.strCategory;
            categoriasSelect.append(option);
        });
    }

    //Verificamos cual categoria se selecciona
    function seleccionarCategoria(e) {
        const categoriaSeleccionada = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoriaSeleccionada}`;
        obtenerInformacion(url, "meals", generarRecetas)
    }

    //Mostramos las recetas de la categoria seleccionada
    function generarRecetas(recetas) {

       
        if (resultadoDiv.firstChild) {
            limpiarHTML(resultadoDiv);
        }

        const heading = crearEtiquetaHtml("h2", "text-center text-black my-5");
        heading.textContent = recetas.length ? "Resultados" : "No hay resultados";
        resultado.append(heading);

        recetas.forEach(receta => {
            const {
                idMeal = receta.id, 
                strMeal = receta.titulo,
                strMealThumb = receta.img} = receta;
            
            const recetaContenedor = crearEtiquetaHtml("div", "col-md-4");
            const recetaCard = crearEtiquetaHtml("div", "card mb-4");
            const recetaImagen = crearEtiquetaHtml("img", "card-img-top");
            datosIMG(recetaImagen, strMealThumb, `Imagen de la receta ${strMeal}`);

            const recetaCardBody = crearEtiquetaHtml("div", "card-body");
            const recetaHeading = crearEtiquetaHtml("h3", "card-title mb-3", strMeal);
            const recetaButton = crearEtiquetaHtml("button", "btn btn-danger w-100", "Ver receta");

            recetaButton.addEventListener("click", () => seleccionarReceta(idMeal));

            //adjuntamos variables HTML.
            recetaCardBody.append(recetaHeading, recetaButton);
            recetaCard.append(recetaImagen, recetaCardBody);
            recetaContenedor.append(recetaCard);

            mostrarRecetasHTML(recetaContenedor);
        })
    }

    function crearEtiquetaHtml(etiqueta, clases, textContent) {
        const etiquetaContenedor = document.createElement(etiqueta);
        etiquetaContenedor.className = clases;

        if (textContent) {
            etiquetaContenedor.textContent = textContent;
        }

        return etiquetaContenedor;
    }

    function datosIMG(img, imgSrc, imgAlt) {
        img.src = imgSrc;
        img.alt = imgAlt;
    }

    function mostrarRecetasHTML(recetas) {
        resultado.append(recetas);
    }

    function seleccionarReceta(id) {
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        obtenerInformacion(url, "meals", mostrarDatosReceta);

    }

    function limpiarHTML(selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    }

    function mostrarDatosReceta(receta) {
        const { idMeal, strInstructions, strMeal, strMealThumb } = receta[0];

        const modalTitle = document.querySelector(".modal .modal-title");
        modalTitle.textContent = strMeal;

        const modalBody = document.querySelector(".modal .modal-body");
        limpiarHTML(modalBody);

        const modalBodyImg = crearEtiquetaHtml("img", "img-fluid");
        datosIMG(modalBodyImg, strMealThumb, `Receta ${strMeal}`);

        const modalBodyTitle = crearEtiquetaHtml("h3", "my-3", "Instrucciones");
        const modalBodyInstructions = crearEtiquetaHtml("p", "", strInstructions);

        const modalBodySubTitle = crearEtiquetaHtml("h3", "my-3", "Ingredientes y cantidadades");

        //Mostrar ingredientes
        const ul = crearEtiquetaHtml("ul", "list-group");
        obtenerIngredientes(receta[0], ul, 20)

        //Añadir contenido a HTML
        modalBody.append(modalBodyImg, modalBodyTitle, modalBodyInstructions, modalBodySubTitle, ul);


        //botones de cerrar y favorito

        const modalFooter = document.querySelector(".modal-footer");
        limpiarHTML(modalFooter);
        const btnFavorito = crearEtiquetaHtml("button", `btn ${existeStorage(idMeal) ? "btn-danger" : "btn-success"} col`, existeStorage(idMeal) ? "Eliminar Favorito" : "Guardar favorito");
        btnFavorito.addEventListener("click", () => {
            if (existeStorage(idMeal)) {
                modificarBoton(btnFavorito, "Guardar favorito", "btn-success");
                mostrarToast("Eliminado correctamente");
                return eliminarFavorito(idMeal);
            }
            agregarFavorito({ id: idMeal, titulo: strMeal, img: strMealThumb });
            modificarBoton(btnFavorito, "Eliminar Favorito", "btn-danger");
            mostrarToast("Agregado a favoritos");

        });
        const btnCerrarModal = crearEtiquetaHtml("button", "btn btn-secondary col", "Cerrar");
        btnCerrarModal.addEventListener("click", () => modal.hide());

        modalFooter.append(btnFavorito, btnCerrarModal);


        //Muestra el modal
        modal.show()
    }

    function obtenerIngredientes(receta, contenedor, ingredientesMax) {
        for (let i = 1; i < ingredientesMax; i++) {
            if (receta[`strIngredient${i}`]) {
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];
                const li = crearEtiquetaHtml("li", "list-group-item", `${ingrediente} - ${cantidad} `);
                contenedor.append(li);
            }
        }

    }

    function agregarFavorito(receta) {
        const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
        localStorage.setItem("favoritos", JSON.stringify([...favoritos, receta]));
    }

    function eliminarFavorito(id) {
        const favoritos = JSON.parse(localStorage.getItem("favoritos"));
        const nuevosFavoritos = favoritos.filter(favorito => favorito.id !== id);
        localStorage.setItem("favoritos", JSON.stringify(nuevosFavoritos));
        if (favoritosDiv) {
            limpiarHTML(favoritosDiv);   
            generarRecetas(nuevosFavoritos);  
            modal.hide();       
        }
    }

    function existeStorage(id) {
        const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? [];
        return favoritos.some(favorito => favorito.id === id);
    }

    function modificarBoton(boton, texto, claseNueva) {
        boton.textContent = texto;
        claseNueva === "btn-success" ? boton.classList.replace("btn-danger", "btn-success") : boton.classList.replace("btn-success", "btn-danger");
    }

    function mostrarToast(mensaje) {
        const toastDiv = document.getElementById("toast");
        const toastBody = document.querySelector(".toast-body");
        toastBody.textContent = mensaje;
        const toast = new bootstrap.Toast(toastDiv);
        toast.show();
    }

    function obtenerFavoritos(){
        const favorito = JSON.parse(localStorage.getItem("favoritos")) ?? [];
        if (favorito.length) {
            return generarRecetas(favorito);
        }
        const noFavoritos = crearEtiquetaHtml("p","fs-4 text-center font-bold mt-5", "No hay recetas favoritas");
        favoritosDiv.append(noFavoritos);
    }
}

document.addEventListener("DOMContentLoaded", iniciarApp);