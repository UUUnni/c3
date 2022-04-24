var qw = location.search.length ? ~~location.search.slice(1) : -1,
    exp = 1.15,
    ww = 200,
    sz = 10;
    MINCOUNT = 0;

var resetButton = document.getElementById("resetButton");
resetButton.onclick = function(){
  window.location.reload(true);
}

var langButton = document.getElementById("langButton");
langButton.onclick = function(){
    load();
}

function load(){
  
  var langSelector = document.getElementById("langSelector");
  var lang = langSelector.options[langSelector.selectedIndex].value;
  console.log(lang);

  jsonPath = "../data/wcs/"+lang+"/c3_data.json";
  c3.load(jsonPath);

  var C = c3.color.length,
      W = c3.terms.length,
      H = d3.range(0,C).map(c3.color.entropy);
  
  visualize("wcs", H, C);
  visualize1("wcsSaliency", H, C);
}


function visualize1(name, H, C){
    var minE = H[0];
    var maxE = H[0];
    for (var i = 1; i < H.length; i++) {
        minE = Math.min(minE, H[i]);
        maxE = Math.max(maxE, H[i]);
    }

    data = d3.range(0,C).map(function(i) {
        return { "c": c3.color[i], "h": H[i] };
    }); 
    data.sort(function(a,b){  return b.h - a.h})

    var div = d3.select('#'+name);
    for(var i=0; i<C; i++){
        var subdiv = div.append("div")
        .style("display", "table")
        .style("margin", "10px");
        subdiv.append("div")
        .style("display", "table-cell")
        .style("width", "100px")
        .style("background-color", function(c) { return data[i].c; })
        .html("&nbsp;");
        subdiv.append("div")
        .style("display", "table-cell")
        .style("padding-left", "20px")
        .html(data[i].c+"&nbsp;");
        subdiv.append("div")
        .style("display", "table-cell")
        .style("padding-left", "20px")
        .html((data[i].h-minE)/(maxE-minE)+"&nbsp;");
    }
}

function visualize(name, H, C) {
  data = d3.range(0,C).map(function(i) {
    return { "chip": i, "s": 1/Math.pow(2,-H[i]) };
  });

  function ss(d) {
    var s = d.s;
    var interp = ((s-minsal)/(maxsal-minsal));
    return 1.2 + (sz-1)*Math.pow(interp, exp);
  }

  var minsal = d3.min(data, function(d) { return d.s; }),
      maxsal = d3.max(data, function(d) { return d.s; }),
      maxqw = d3.max(data, function(d) { return qw<0 ? 1 : c3.count(d.chip, qw); }),
      xa = function(x) { return ww*(x+120)/240; },
      yb = function(y) { return ww - ww*(y+120)/240; };
  var L = [-1,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,110];

  var sum = data.reduce(function(a,b) { return a + b.s; }, 0);
  var thresh = -1000; // sum / data.length - 0.1;
  function filtered(lidx) {
    // filter to current L* bounds
    var a = data.filter(function(d) {
      var c = d.chip, ll = c3.color[c].L;
      return c3.color.count[c] > MINCOUNT &&  
          (ll >= L[lidx] && ll < L[lidx+1] && d.s > thresh);
    });
    // sort so larger squares are drawn first
    a.sort(function(a,b) { return b.s - a.s; });
    return a;
  }

  var div = d3.select("#"+name)
   .selectAll("div.color")
      .data(d3.range(0,L.length-1))
   .enter().append("div")
      .attr("class", "color");

  var svg = div.append("svg:svg")
      .style("width", 10+ww+"px")
      .style("height", ww+"px");

  div.append("div").text(function(d) { return "L* = "+d*5; });

  svg.append("svg:rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", ww)
    .attr("height", ww)
    .style("fill", "#ffffff")
    .style("stroke", "#cccccc")
    .style("stroke-width", 1.0);

  svg.selectAll("rect.swatch")
      .data(function(Lidx) { return filtered(Lidx); })
    .enter().append("svg:rect")
      .attr("class", "swatch")
      .attr("x", function(d) { return xa(c3.color[d.chip].a) + 0.5*(sz-ss(d)); })
      .attr("y", function(d) { return yb(c3.color[d.chip].b) + 0.5*(sz-ss(d)); })
      .attr("width", function(d) { return Math.floor(ss(d)); })
      .attr("height", function(d) { return Math.floor(ss(d)); })
      .style("stroke", "#ccc").style("stroke-width", 0.3)
      .style("fill", function(d,i) { return c3.color[d.chip]; })
      .style("fill-opacity", function(d,i) { return qw<0 ? 1 : Math.min(1, Math.pow(c3.count(d.chip, qw)/maxqw, 0.5)); })
    .append("svg:title")
      .text(function(d) {
        var c = c3.color[d.chip],
            fmt = function(d) { return c3.terms[d.index]+" "+(100*d.score).toFixed(1)+"%"; },
            names = c3.color.relatedTerms(d.chip, 5).map(fmt).join(", ");
        return d.chip+" ("+c3.color.count[d.chip]+"): " + 
            "("+[c.L,c.a,c.b].join(",")+") - " + names;
      });

}