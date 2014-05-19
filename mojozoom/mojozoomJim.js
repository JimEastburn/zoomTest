var MojoZoom = (function() {
	var dc = function(tag) {return document.createElement(tag);};

	var defaultWidth = 256;
	var defaultHeight = 256;



	function addEvent(element, ev, handler) 
	{
		var doHandler = function(e) {
			return handler(e||window.event);
		}
		if (element.addEventListener) { 
			element.addEventListener(ev, doHandler, false); 
		} else if (element.attachEvent) { 
			element.attachEvent("on" + ev, doHandler); 
		}
	}

	function getElementPos(element)
	{
		var x = element.offsetLeft;
		var y = element.offsetTop;
		var parent = element.offsetParent;
		while (parent) {
			x += parent.offsetLeft - parent.scrollLeft;
			y += parent.offsetTop - parent.scrollTop;
			parent = parent.offsetParent;
		}
		return {
			x : x,
			y : y
		}
	}

	function getEventMousePos(element, e) {
		var scrollX = document.body.scrollLeft || document.documentElement.scrollLeft;
		var scrollY = document.body.scrollTop || document.documentElement.scrollTop;

		if (e.currentTarget) {
			var pos = getElementPos(element);
			return {
				x : e.clientX - pos.x + scrollX,
				y : e.clientY - pos.y + scrollY
			}
		}
		return {
			x : e.offsetX,
			y : e.offsetY
		}
	}

	function makeZoomable(img, zoomSrc, zoomImgCtr, zoomWidth, zoomHeight, alwaysShow) {
		// make sure the image is loaded, if not then add an onload event and return
		if (!img.complete && !img.__mojoZoomQueued) {
			addEvent(img, "load", function() {
				img.__mojoZoomQueued = true;
				setTimeout(function() {
				makeZoomable(img, zoomSrc, zoomImgCtr, zoomWidth, zoomHeight, alwaysShow);
				}, 1);
			});
			return;
		}

		img.__mojoZoomQueued = false;

		// Wrap everything in a timeout.
		// this fixes a problem where, if makeZoomable is called a second time after changing the src,
		// FF would not have figured out the new offsetHeight of the image yet. A small timeout helps though it's rather hackish.
		setTimeout(function(){

		// sorry
		var isIE = !!document.all && !!window.attachEvent && !window.opera;

		var w = img.offsetWidth;
		var h = img.offsetHeight;

		var oldParent = img.parentNode;
		if (oldParent.nodeName != "A") {
			var linkParent = dc("a");
			linkParent.setAttribute("href", zoomSrc);
			oldParent.replaceChild(linkParent, img);
            img.style.position = "absolute";
            img.style.zIndex = 1;
            img.style.cursor = "pointer";

			linkParent.appendChild(img);
		} else {
			var linkParent = oldParent;
		}

		linkParent.style.position = "relative";
		linkParent.style.display = "block";
        linkParent.style.width = defaultWidth+"px";
		linkParent.style.height = defaultHeight+"px";
        linkParent.style.cursor = "default";

		var imgLeft = img.offsetLeft;
		var imgTop = img.offsetTop;

		var zoom = dc("div");
		zoom.className = "mojozoom_marker";

		var zoomImg = dc("img");
		zoomImg.className = "mojozoom_img";

		zoomImg.style.position = "absolute";
		zoomImg.style.left = "-9999px";
		zoomImg.style.top = "-9999px";

		zoomImg.style.maxWidth = "none";
		zoomImg.style.maxHeight = "none";
		document.body.appendChild(zoomImg);

		var parent = img.parentNode;

		var ctr = dc("div");
		ctr.style.position = "absolute";
		ctr.style.left = imgLeft+"px";
		ctr.style.top = imgTop+"px";
		ctr.style.overflow = "hidden";
		ctr.style.display = "none";

		ctr.appendChild(zoom);
		parent.appendChild(ctr);

		var zoomInput = parent;

		// clear old overlay
		if (img.__mojoZoomOverlay)
			parent.removeChild(img.__mojoZoomOverlay);
		img.__mojoZoomOverlay = ctr;

		// clear old high-res image
		if (img.__mojoZoomImage && img.__mojoZoomImage.parentNode)
			img.__mojoZoomImage.parentNode.removeChild(img.__mojoZoomImage);
		img.__mojoZoomImage = zoomImg;

		var useDefaultCtr = false;
		if (!zoomImgCtr) {
			zoomImgCtr = dc("div");
			zoomImgCtr.className = "mojozoom_imgctr";

			var imgPos = getElementPos(img);
            zoomImgCtr.style.left = "0px";
			zoomImgCtr.style.top = imgPos.y + "px";

			zoomImgCtr.style.width = (zoomWidth ? zoomWidth : defaultWidth) +"px";
			zoomImgCtr.style.height = (zoomHeight ? zoomHeight : defaultHeight) +"px";
            zoomImgCtr.style.position = "absolute";
            zoomImgCtr.style.marginLeft = "0px";
            zoomImgCtr.style.border="1px solid black";

			document.body.appendChild(zoomImgCtr);
			useDefaultCtr = true;
		}
		zoomImgCtr.style.overflow = "hidden";

		if (!alwaysShow) {
			zoomImgCtr.style.visibility = "hidden";
		}

		addEvent(zoomImg, "load", function() {

			// bail out if img has been removed from dom
			if (!zoomImg.parentNode) return;
            //console.log("line 172  addEvent(zoomImg, load, function()");

			document.body.removeChild(zoomImg);
			zoomImgCtr.appendChild(zoomImg);

			var isInImage = false;

                addEvent(zoomInput, "click",
                    function(e) {
                        //console.log("line 248  addEvent(zoomInput, click,");
                        e.preventDefault();
                        if(isInImage){
                            ctr.style.display = "none";
                            zoomImgCtr.style.visibility = "hidden";
                            isInImage = false;
                            img.style.opacity = 1;
                            img.style.width = img.naturalWidth + "px";
                            img.style.height = img.naturalHeight + "px";
                        }
                        else{

                            img.style.opacity = 0;
                            img.style.width = defaultWidth + "px";
                            img.style.height = defaultHeight + "px";


                            isInImage = true;

                            var imgPos = getElementPos(img);

                            if (useDefaultCtr) {
                                zoomImgCtr.style.left = "0px";
                                zoomImgCtr.style.top = imgPos.y + "px";
                            }
                            ctr.style.display = "block";
                            zoomImgCtr.style.visibility = "visible";
                        }
                    }
                );


			addEvent(zoomInput, "mousemove",
				function(e) {
                    //console.log("line 275  addEvent(zoomInput, mousemove,");

					var pos = getEventMousePos(zoomInput, e);
					if (e.srcElement && isIE) {
						if (e.srcElement == zoom) return;
						if (e.srcElement != zoomInput) {
							var zoomImgPos = getElementPos(e.srcElement);
							pos.x -= (imgPos.x - zoomImgPos.x);
							pos.y -= (imgPos.y - zoomImgPos.y);
						}
					}
					var xRatio = zoomImg.naturalWidth/defaultWidth;
                    var yRatio = zoomImg.naturalHeight/defaultHeight;

                    if (!isIE) {
                        pos.x -= imgLeft;
                        pos.y -= imgTop;
                    }

					zoomImg.style.left = -((pos.x*xRatio)|0)+"px";
					zoomImg.style.top = -((pos.y*yRatio)|0)+"px";

				}
			);
		});

		// I've no idea. Simply setting the src will make IE screw it self into a 100% CPU fest. In a timeout, it's ok.
		setTimeout(function() { 
			zoomImg.src = zoomSrc;
		}, 1);

		}, 1);
	}

	function init() {
		var images = document.getElementsByTagName("img");
		for (var i=0;i<images.length;i++) {
			var img = images[i];
			var zoomSrc = img.getAttribute("data-zoomsrc");
			if (zoomSrc) {
				makeZoomable(img, zoomSrc, document.getElementById(img.getAttribute("id") + "_zoom"), null, null, img.getAttribute("data-zoomalwaysshow")=="true");
			}
		}
	}

	return {
		addEvent : addEvent,
		init : init,
		makeZoomable : makeZoomable
	};

})();
MojoZoom.addEvent(window, "load", MojoZoom.init);
