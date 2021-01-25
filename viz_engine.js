
// The following code uses d3.js, or Data-Driven Documents, created by Mike Bostock. 
// The animation is inspired by the following post by Nathan Yau: 
// http://flowingdata.com/2017/05/17/american-workday/

var first_time = true

var go = true;

function stop() {
  if (go) {
    go = false
    d3.select("#stop_button").text('Play');
  } else {
    go = true
    d3.select("#stop_button").text('Pause');
  }
}

var USER_SPEED = "medium";

var margin = {top: 105, right: 50, bottom: 50, left: 160 },
    width = 1090 - margin.left - margin.right,
	  height = 600 - margin.top - margin.bottom,
    padding = 3, // separation between nodes
    radius = 3.5,
    damper = 0.35;
	
var sched_objs = [],
	curr_month = 0;
var last_month = 240;

// Codes for marital statuses.
var mstat_codes = {
	"m": {"short": "Married", "desc": "Married"},
	"c": {"short": "Cohabiting", "desc": "Cohabiting"},
	"s": {"short": "Single", "desc": "Single"},
};

// Codes for group names. In this animation groups are different
// cohorts. We have only two of them, but the code is written in
// such a way that more can be easily accomodated.

var colors = ['#E17C05','#0F8554','#38A6A5','#1D6996','#94346E','#CC503E',
              '#5F4690','#73AF48','#EDAD08','#6F4070','#994E95','#666666',
              '#007d81','#f58220']

var group_colors = {
  0:	{ "name": "Group0", color: colors[0], count: 0 },
  1:	{ "name": "Group1", color: colors[1], count: 0 },
  2:	{ "name": "Group2", color: colors[2], count: 0 },
  3:	{ "name": "Group3", color: colors[3], count: 0 },
	4:	{ "name": "Group4", color: colors[4], count: 0 },
	5:	{ "name": "Group5", color: colors[5], count: 0 },
	6:	{ "name": "Group6", color: colors[6], count: 0 },
	7:	{ "name": "Group7", color: colors[7], count: 0 },
	8:	{ "name": "Group8", color: colors[8], count: 0 },
	9:	{ "name": "Group9", color: colors[9], count: 0 },
	10:	{ "name": "Group10", color: colors[10], count: 0 },
	11:	{ "name": "Group11", color: colors[11], count: 0 },
	12:	{ "name": "Group12", color: colors[12], count: 0 },
	13:	{ "name": "Group13", color: colors[13], count: 0 },
}

// The first cohort is assigned the GGP green color, the second one the GGP
// orange color and the last one the GGP blue color. For the blue, here is
// the codes for a brigther version: #1e3a95

// Codes for parity statuses names. Colors are there because they might
// be used if one chooses another type of visualisation with, say, more
// emphasis on the number of children.
var pstat_names = {
	"0":	{ "name": "No Child", color: "#6b8ef7", count: 0 },
	"1":	{ "name": "1 Child", color: "#05b1b5", count: 0 },
	"2":	{ "name": "2 Children", color: "#38c40a", count: 0 },
	"3":	{ "name": "3 Children", color: "#dd5a62", count: 0 },
	"4":	{ "name": "4+ Children", color: "#eca0a5", count: 0 }, /*
	"5":	{ "name": "Five Children", color: "#fedc5b", count: 0 },
	"6":	{ "name": "Six Children", color: "#cf6001", count: 0 }, */
}


// This variable associates a speed to each speed button. The speed is
// expressed in milliseconds after which the animation is refreshed.
var speeds = { "slow": 1000, "medium": 250, "fast": 100 };


// Here are notes that describe the most relevant demographic facts that are illustrated
// in the animation. The start and stop months determine when the note will appear
// and when it will disappear. The notes, like the rest of the animation, start over
// once the time counter has reached 35 years.
var time_notes = [
	{ "start_month": 10, "stop_month": 40, "note": "In this GGS data visualisation you see the partnership and fertility histories of a random sample of 500 individuals equally divided between the country-cohort combinations you selected (Source: GGS). For more info visit: www.ggp-i.org" },
	{ "start_month": 50, "stop_month": 130, "note": "Use the Pause button to pause the animation, you'll see the age freezing and the dots gradually becoming static. You can then press the Play button to reactivate the visualisation." },
	{ "start_month": 140, "stop_month": 230, "note": "Use the speed buttons to make the animation go slower or faster. To change your selection, press the Reset button, select the countries and cohorts, then start the animation by pressing the Start button." },
];
var notes_index = 0;

// Here we initialize the x axis
var x = d3.scale.ordinal()
    .rangePoints([50, width]);
var xAxis = d3.svg.axis()
    .scale(x)
    .tickFormat(function(d) {
        return pstat_names[d]['name'];
    })
    .orient("top");
// var xGrid = d3.svg.axis()
// 	.scale(x)
//     .orient("bottom")
//     .innerTickSize(-(height+margin.top));
    // .tickPadding(10);

// Here we initialize the y axis	
var y = d3.scale.ordinal()
	.domain(Object.keys(mstat_codes))
    .rangePoints([0, height-150]);
var yAxis = d3.svg.axis()
	.scale(y)
	.tickSize(40)
	.tickFormat(function(d) {
		console.log(Object.keys(mstat_codes));
		return mstat_codes[d]['desc'];
	})
	.orient("left");


// Here we start the SVG, which is the graphical engine behind the animation
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
// We import the data directly from the GitHub repository

var dataset = "https://cdn.jsdelivr.net/gh/eugeniopaglino/demo_hist_viz/hist_data.csv"

// This function reads the user's selections and filters the data accordingly

function filterData(data) {
  
  // We check which countries and cohorts are selected in the drop-down menus
  
  var countries = $('#country_sel').val();
  console.log(countries)
  if (!countries) {
    countries = ['Sweden','France']
  }
  var cohorts = $('#cohort_sel').val();
  if (!cohorts) {
    cohorts = ['1945-1950','1965-1970']
  }
  var sexes = $('#sex_sel').val();
  if (!sexes) {
    sexes = ['Both']
  }
  var residences = $('#residence_sel').val();
  if (!residences) {
    residences = ['Both']
  }
  var educations = $('#education_sel').val();
  if (!educations) {
    educations = ['Both']
  }
  
  var num_of_groups = cohorts.length*countries.length

  // We then filter our data so that it contains only the groups selected
  // by the user
  
  var data = data.filter(function(d){
      return (cohorts.includes(d.cohort))
  })  
  
  var data = data.filter(function(d){
      return (countries.includes(d.acountry))
  })
  
  return {data:data,num_of_groups:num_of_groups}

}

// This funtion assigns a unique progressive group ID to each group. This ID
// will be later used to assign a color to each group

function assignGroupNum(data){
  
 var groupids = [data[0]['group']]
    var group_names = [data[0]['acountry'].concat(' ',data[0]['cohort'])]
    var group_name = ''
    group_num = 0
    
    for (var i = 0; i < data.length; i++) {
      data[i]['group_num'] = group_num
      if (!(groupids.includes(data[i]['group']))) {
        groupids.push(data[i]['group'])
        group_name = data[i]['acountry'].concat(' ',data[i]['cohort'])
        group_names.push(group_name)
        group_num = ++group_num
      }
    }
    
  return {data:data,group_names:group_names}
  
}

// This function resizes the data so that it has a total of max_dots obervations
// equally divided among the groups

function resizeData(data,num_of_groups,max_dots) {
    	  
  var resized_data = []
  var group = data[0].group_num
  var size = 0
  var group_size = (max_dots/num_of_groups).toFixed(0)
  
  for (var i = 0; i < data.length; i++) {
    if (data[i].group_num == group) {
      if (size < group_size) {
        resized_data[size + group*group_size] = data[i]
        size = ++size
      }
    } else {
      size = 0
      group = data[i].group_num
      resized_data[size + group*group_size] = data[i]
    }
  }
  
  return resized_data
}

// This is simply a wrapper function that calls all the lower level functions
// that perform the cleaning and filtering steps.

function prepareData(data,max_dots) {
  
  var return_values = filterData(data)
  var data = return_values.data
  var num_of_groups = return_values.num_of_groups
  var return_values = assignGroupNum(data)
  var data = return_values.data
  var group_names = return_values.group_names
  var data = resizeData(data,num_of_groups,max_dots)
  
  return {data:data,group_names:group_names}
  
}
  
function startAnimation() {
  
// This if statement prevents users from creating problems by pressing the
// start button multiple times.

  if (first_time) {

// Here we load the data that we have prepared. The structure of the data is the
// following one:

//    - the first column contains the group code for each observation.
//    - a tab character separates the first column from the subsequent ones.
//    - the remaining columns are to be read in pairs where the first one 
//      contains the status code and the second one contains the 
//      duration of that status in months.
//    - the status code contains a letter, which corresponds to the marital
//      status, and a number, which corresponds to the number of children.

    // Load data and let's do it.
    
    d3.csv(dataset, function(error, raw_data) {
      
      
      var return_values = prepareData(raw_data,500)
    	var data = return_values.data
    	var group_names = return_values.group_names
    	
    	var labels = [0, 1, 2, 3, 4];
    	
    	// replace labels with the following commented expression to reset to the original
    	// code which was dynamic and changed the number of labels to set it equal to the
    	// number of unique groups in the dataset.
    	
    	// d3.map(data, function(d) { return d.grp; }).keys()
    	
    	
    		// Here we create "ticks" in the x and y axes, one for each group
	      // and marital status. These will constitute a grid where clusters
	      // of nodes will locate.
	      
    	x.domain(labels);
        svg.append("g")
            .attr("class", "y axis")
    		.attr("transform", "translate(-70,-10)")
    		.call(yAxis)
     	  .selectAll(".tick text")
        	.call(wrap, 80);
    	svg.append("g")
    		.attr("class", "x axis")
    		.attr("transform", "translate(0,-100)")
    		.call(xAxis)
         .selectAll(".tick text")
            .call(wrap, x.rangeBand());
    	
    	
    	// 
    	// Counters
    	//
    	
    	/*
    	
    	var counter = svg.selectAll(".counter")
    		.data(Object.keys(pstat_names))
    	  .enter().append("g")
    		.attr("class", "counter")
    		.attr("transform", function(d) { return "translate("+x(d)+",-60)"; })
    	  .append("text")
    		.attr("text-anchor", "middle")
    		.text(function(d,i) { 
    			if (i == 0) {
    				return "With Child " + readablePercent(pstat_names[d].count); 
    			} else {
    				return readablePercent(pstat_names[d].count); 
    			}
    		});
    	
    	*/
    	
    	// Finally we extract the data from the csv file. An object is created with four
	    // properties: group, number of children, marital status, and duration. The group 
	    // is static, in the sense that individuals do not change group during the animation. 
	    // Marital status, number of children and duration are stores in three arrays which 
	    // contain multiple entries (as many as the number of status changes).
    	data.forEach(function(d) {
    		var hist_array = d.sequence.split(",");
    		var activities = [];
    		for (var i=0; i < hist_array.length; i++) {
    			// Duration
    			if (i % 2 == 1) {
    				activities.push({
    					'grp': d.group_num, 
    					'numchildren': hist_array[i-1].substring(1), 
    					'mstat': hist_array[i-1].substring(0, 1), 
    					'duration': +hist_array[i]});
    			}
    		}
    		sched_objs.push(activities);
    	});
    	
    	  
    	// A node for each person's history is created. We will have 250 nodes
	    // per cohort.
    	var nodes = sched_objs.map(function(o,i) {
    		var init = o[0];
    		var init_x = x(init.numchildren) + Math.random();
    		var init_y = y(init.mstat) + Math.random();
    		var col = colorByGroup(init.grp)
    		group_colors[init.grp].count += 1;
    		return {
    			grp: init.grp,
    			numchildren: init.numchildren,
    			mstat: init.mstat,
    			radius: radius,
    			x: init_x,
    			y: init_y,
    			color: col,
    			moves: 0,
    			next_move_time: init.duration,
    			sched: o,
    		}
    	});
    
      // Here we initialize the engine which governs the movement of the nodes
    	var force = d3.layout.force()
    		.nodes(nodes)
    		.size([width, height])
    		.gravity(0)
    		.charge(0)
    		.friction(.9)
    		.on("tick", tick)
    		.start();
    
      // Here we attach a circle to each node
    	var circle = svg.selectAll("circle")
    		.data(nodes)
    	  .enter().append("circle")
    		.attr("r", function(d) { return d.radius; })
    		.style("fill", function(d) { return d.color; });
    
    	// The following code updates nodes based on marital status, number of 
    	// children, and duration.
	    // It checks if a marital status or a parity status has ended and, 
	    // in case, it moves the node to the next position.
    	function timer() {
    	  
    	  if (go) {
      		d3.range(nodes.length).map(function(i) {
      			var curr_node = nodes[i],
      				curr_moves = curr_node.moves;
      			var curr_grp = 0
      
      			// Time to go to next marital status
      			if (curr_node.next_move_time == curr_month) {
      				if (curr_node.moves == curr_node.sched.length-1) {
      					curr_moves = 0;
      				} else {
      					curr_moves += 1;
      				}
      				
      			/*	
      				// Keep track of individuals which have no children.
  				  if (curr_node.mstat=="n" && curr_node.sched[ curr_moves ].mstat != "n") {
  					  group_colors[curr_node.group].count -= 1;
  				  }
  				  if (curr_node.mstat!="n" && curr_node.sched[ curr_moves ].mstat == "n") {
  					  group_colors[curr_node.group].count += 1;
  				  }
  				  */
      			
      				// Moves nodes on to next status
      				curr_node.numchildren = curr_node.sched[ curr_moves ].numchildren;
      				curr_node.mstat = curr_node.sched[ curr_moves ].mstat;
      				curr_node.moves = curr_moves;
      				curr_node.cx = x(curr_node.numchildren);
      				curr_node.cy = y(curr_node.mstat);
      			
      				nodes[i].next_move_time += nodes[i].sched[ curr_node.moves ].duration;
      			}
      
      		});
    	  }
    
    		force.resume();
    		if (go) {
    		  curr_month += 1;
    		}
    		
    
        /*
    
    		// Update percentages
    		svg.selectAll(".counter text")
    			.text(function(d, i) {
    				if (i == 0) {
    					return "With Child " + readablePercent(75 - pstat_names[d].count); 
    				} else {
    					return readablePercent(75 - pstat_names[d].count); 
    				}
    			});
    			
    			*/
    
    	
    		// Updates age
    		var true_month = curr_month % last_month;
    		d3.select("#current_age").text(monthsToAge(true_month));
    		
    		
    		// Update notes
    		if (true_month == time_notes[notes_index].start_month) {
    			d3.select("#note")
    			  .transition()
    				.duration(1000)
    				.style("color", "#000000")
    				.text(time_notes[notes_index].note);
    		} 
    		
    		// Makes note disappear when they have reached their
		    // stop month.
    		else if (true_month == time_notes[notes_index].stop_month) {
    			
    			d3.select("#note").transition()
    				.duration(1000)
    				.style("color", "#ffffff");
    				
    			notes_index += 1;
    			if (notes_index == time_notes.length) {
    				notes_index = 0;
    			}
    		}
    		
    		setTimeout(timer, speeds[USER_SPEED]);
    		  
    	} // Here ends the timer function
    		
    	function tick(e) {
    	  var k = 0.1 * e.alpha;
      
    	  // Push nodes toward their designated focus.
    	  nodes.forEach(function(o, i) {
    		var curr_numchildren = o.numchildren;
    		o.color = colorByGroup(o.grp);
    		
    		o.x += (x(o.numchildren) - o.x) * k * damper;
    	    o.y += (y(o.mstat) - o.y) * k * damper;
    	    
    	  });
    
    	  circle
    	  	  .each(collide(.5))
    	  	  .style("fill", function(d) { return d.color; })
    	      .attr("cx", function(d) { return d.x; })
    	      .attr("cy", function(d) { return d.y; });
    	}
    
    
    	// Resolve collisions between nodes.
    	function collide(alpha) {
    	  var quadtree = d3.geom.quadtree(nodes);
    	  return function(d) {
    	    var r = d.radius + radius + padding,
    	        nx1 = d.x - r,
    	        nx2 = d.x + r,
    	        ny1 = d.y - r,
    	        ny2 = d.y + r;
    	    quadtree.visit(function(quad, x1, y1, x2, y2) {
    	      if (quad.point && (quad.point !== d)) {
    	        var x = d.x - quad.point.x,
    	            y = d.y - quad.point.y,
    	            l = Math.sqrt(x * x + y * y),
    	            r = d.radius + quad.point.radius + (d.mstat !== quad.point.mstat) * padding;
    	        if (l < r) {
    	          l = (l - r) / l * alpha;
    	          d.x -= x *= l;
    	          d.y -= y *= l;
    	          quad.point.x += x;
    	          quad.point.y += y;
    	        }
    	      }
    	      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    	    });
    	  };
    	}
    	
    	// This code makes the speed button work
    	d3.selectAll(".togglebutton")
          .on("click", function() {
            if (d3.select(this).attr("data-val") == "slow") {
                d3.select(".slow").classed("current", true);
    			d3.select(".medium").classed("current", false);
                d3.select(".fast").classed("current", false);
            } else if (d3.select(this).attr("data-val") == "medium") {
                d3.select(".slow").classed("current", false);
    			d3.select(".medium").classed("current", true);
                d3.select(".fast").classed("current", false);
            } 
    		else {
                d3.select(".slow").classed("current", false);
    			d3.select(".medium").classed("current", false);
    			d3.select(".fast").classed("current", true);
            }
    		
    		USER_SPEED = d3.select(this).attr("data-val");
        });
        
        timer(); // Here we call the timer function which then keeps calling
      	         // itself thanks to the setTimeout function inside it.
      	         
      // Finally we create the legend

      // Add one dot in the legend for each name.
      svg.selectAll("mydots")
        .data(group_names)
        .enter()
        .append("circle")
          .attr("cx", function(d,i){ return 50 + i%4*200})
          .attr("cy", function(d,i){ return 410 + Math.floor(i/4)*20}) // 100 is where the first dot appears. 25 is the distance between dots
          .attr("r", 7)
          .style("fill", function(d,i){ return colors[i]})
      
      // Add one dot in the legend for each name.
      svg.selectAll("mylabels")
        .data(group_names)
        .enter()
        .append("text")
          .attr("x", function(d,i){ return 70 + i%4*200})
          .attr("y", function(d,i){ return 410 + Math.floor(i/4)*20}) // 100 is where the first dot appears. 25 is the distance between dots
          .style("fill", function(d, i){ return colors[i]})
          .text(function(d){ return d})
          .attr("text-anchor", "left")
          .style("alignment-baseline", "middle")
            	   
          });
    
    first_time = false;
    
  }// Here ends the if in the start animation function
  
} // Here ends the function that starts the animation, reads and manipulate the data

// This is the function that assigns the color to each group

function colorByGroup(occ) {
	return group_colors[occ].color;
}

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}



// Output readable percent based on count.
function readablePercent(n) {
	
	var pct = 100 * n / 75;
	if (pct < 1 && pct > 0) {
		pct = "<1%";
	} else {
		pct = Math.round(pct) + "%";
	}
	
	return pct;
}


// Months to age in years and fractions of year. Data is months from date of birth.
function monthsToAge(m) {
  var months = m + 180;
  var precise_age = months / 12
  var age = precise_age.toFixed(1);
	return "Age: " + age;
}
