const WORKER_INTERVAL = 60 * 1000;

var activeChart = null;
var chartOptions = {
  height: '8rem',
  axisX: {
    type: Chartist.FixedScaleAxis,
    divisor: 24,
    labelInterpolationFnc: function (value) {
      return moment(value).format('HH:mm');
    }
  },
  axisY: {
    onlyInteger: true,
    low: 0,
    labelInterpolationFnc: function (value) {
      return value ? 'Online' : 'Offline';
    }
  },
  series: {
    history: {
      // lineSmooth: Chartist.Interpolation.simple(),
      lineSmooth: Chartist.Interpolation.step(),
      showPoint: false,
      showArea: true
    }
  }
};
var responsiveOptions = [
  ['screen and (max-width: 1024px)', {
    axisX: {
      divisor: 16
    }
  }],
  ['screen and (max-width: 768px)', {
    axisX: {
      divisor: 10
    }
  }],
  ['screen and (max-width: 468px)', {
    axisX: {
      divisor: 5
    }
  }]
];

ready(function () {
  var winWidth = document.body.offsetWidth || document.documentElement.offsetWidth || window.innerWidth;
  updateTimestampStatusElements();
  bindItemEventListener();
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
  var isActive = activeItem.classList.contains('active');
  if (itemList && itemList.length > 0) {
    itemList = Array.prototype.slice.call(itemList);
    itemList.forEach(function (item) {
      if (item !== activeItem && item.classList.contains('active')) {
        removeClass(item, 'active');
        unloadChart(item);
      }
    });
  }
  if (isActive) {
    unloadChart(activeItem);
  } else {
    loadChart(activeItem);
  }
  toggleClass(activeItem, 'active');
}

function unloadChart (item) {
  var chart = item.querySelector('.ct-chart');
  if (chart) {
    chart.parentElement.removeChild(chart);
    activeChart.detach();
  }
}

function loadChart (item) {
  var id = item.dataset.id;
  var data = {
    series: [{
      name: 'history'
    }]
  };

  var request = new XMLHttpRequest();
  request.open('GET', '/api/history/' + id);

  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      if (request.responseText) {
        var result = JSON.parse(request.responseText);
        data.series[0].data = generateSeries(result);
        var history = item.querySelector('.js-history');
        if (history) {
          var chart = document.createElement('div');
          chart.setAttribute('class', 'ct-chart ct-perfect-fourth');
          history.appendChild(chart);
          if (activeChart) {
            activeChart.detach();
          }
          activeChart = new Chartist.Line('.ct-chart', data, chartOptions, responsiveOptions);
          activeChart.on('draw', function(data) {
            if(data.type === 'line' || data.type === 'area') {
              data.element.animate({
                d: {
                  begin: 50 * data.index,
                  dur: 500,
                  from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
                  to: data.path.clone().stringify(),
                  easing: Chartist.Svg.Easing.easeOutQuint
                }
              });
            }
          });
        }
      }
    }
  }

  request.send();
}

function generateSeries(data) {
  const now = Date.now();
  const result = [];

  if (data && data.length) {
    for (let i = 0; i < data.length; i++) {
      const current = data[i];
      const hasNext = data.length > i + 1;

      result.push({
        x: new Date(current),
        y: 1
      });

      if (hasNext) {
        const next = data[i + 1];
        const gaps = getGaps(current, next, WORKER_INTERVAL)
          .map(timestamp => ({
            x: new Date(timestamp),
            y: 0
          }));

        result.push(...gaps);
      }

      if (i === data.length - 1) {
        const gaps = getGaps(current, now, WORKER_INTERVAL)
          .map(timestamp => ({
            x: new Date(timestamp),
            y: 0
          }))

        result.push(...gaps);
      }
    }
  }

  return result;
}

function getGaps(start, end, interval, delta = 30 * 1000) {
  const result = [];
  const diff = end - start;

  if (diff > interval + delta) {
    let last = start;

    while (last + interval < end) {
      last += interval;

      result.push(last);
    }
  }

  return result;
}

function updateTimestampStatusElements () {
  var timestampElementList = document.querySelectorAll('.js-timestamp');
  if (timestampElementList && timestampElementList.length > 0) {
    timestampElementList = Array.prototype.slice.call(timestampElementList);
    timestampElementList.forEach(function (timestampElement) {
      if (timestampElement.dataset.timestamp) {
        var difference = Date.now() - timestampElement.dataset.timestamp;
        if (difference < 10 * 60 * 1000) {
          timestampElement.classList.add('success');
        } else if (difference < 30 * 60 * 1000) {
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