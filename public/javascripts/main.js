ready(function () {
  var winWidth = document.body.offsetWidth || document.documentElement.offsetWidth || window.innerWidth;
  updateTimestampStatusElements();
  if (winWidth <= 320) {
    bindItemEventListener();
  }
});

function bindItemEventListener () {
  var itemList = document.querySelectorAll('.js-item');
  if (itemList && itemList.length > 0) {
    itemList = Array.prototype.slice.call(itemList);
    itemList.forEach(function (item) {
      var clickEvent = !document.ontouchstart ? 'click' : 'touchstart';
      item.addEventListener(clickEvent, function (event) {
        handleItemClickEvent(item);
      });
    });
  }
}

function handleItemClickEvent (activeItem) {
  var itemList = document.querySelectorAll('.js-item');
  if (itemList && itemList.length > 0) {
    itemList = Array.prototype.slice.call(itemList);
    itemList.forEach(function (item) {
      if (item !== activeItem) {
        removeClass(item, 'active');
      }
    });
  }
  toggleClass(activeItem, 'active');
}

function updateTimestampStatusElements () {
  var timestampElementList = document.querySelectorAll('.js-timestamp');
  if (timestampElementList && timestampElementList.length > 0) {
    timestampElementList = Array.prototype.slice.call(timestampElementList);
    timestampElementList.forEach(function (timestampElement) {
      if (timestampElement.dataset.timestamp) {
        var difference = Date.now() - timestampElement.dataset.timestamp;
        if (difference < 180000) {
          timestampElement.classList.add('success');
        } else if (difference < 360000) {
          timestampElement.classList.add('warning');
        } else {
          timestampElement.classList.add('danger');
        }
      }
    });
  }
}

function toggleClass (element, className) {
  if (element.classList) {
    element.classList.toggle(className);
  } else {
    var classes = element.className.split(' ');
    var existingIndex = classes.indexOf(className);

    if (existingIndex >= 0) {
      classes.splice(existingIndex, 1);
    }
    else {
      classes.push(className);
    }

    element.className = classes.join(' ');
  }
}

function removeClass (element, className) {
  if (element.classList) {
    element.classList.remove(className);
  }
  else {
    element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }
}

function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}