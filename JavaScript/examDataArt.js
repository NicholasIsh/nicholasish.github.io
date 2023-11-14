




// Check if data is already stored in session storage

if (savedData == "") {
    console.log("Returned data from session storage:", savedData);
    createExamDataArt(savedData);
    clearInterval(loadingInterval);  
} else {
    document.getElementById('loading').style.display = 'block';  
    fetch(`https://api.nasa.gov/neo/rest/v1/feed?startDate=${START_DATE}&endDate=${END_DATE}&api_key=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            console.log("Returned data from API:", data);
            sessionStorage.setItem('myData', JSON.stringify(data));  // Save data to session storage
            createExamDataArt(data);
            clearInterval(loadingInterval);
        });
}

function createExamDataArt(data) {

    const formatDate = d3.timeFormat("%Y-%m-%d");
    for (let date in neos) {
        for (let neo of neos[date]) {

        
            plotData.push({
                diameter: neo.estimated_diameter.meters.estimated_diameter_max,
                velocity: parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_second),
                miss_distance: parseFloat(neo.close_approach_data[0].miss_distance.kilometers)
            });
        }
    }


    const width = 1000;
    const height = 1000;
    const maxSpeed = d3.max(data, d => d.speed);
    const speedScale = d3.scaleLinear()
        .domain([0, maxSpeed])
        .range([0, Math.min(width, height) / 2 - 50]);  
    const svg = d3.select("#examDataArt")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    const defs = svg.append("defs");
    const filter = defs.append("filter")
        .attr("id", "glow")
        .attr("x", "-50%")  
        .attr("y", "-50%")  
        .attr("width", "200%")  
        .attr("height", "200%");  

    filter.append("feGaussianBlur")
        .attr("stdDeviation", "10")
        .attr("result", "coloredBlur");

    filter.append("feFlood")
        .attr("flood-color", "white")
        .attr("result", "whiteColor");

    filter.append("feComposite")
        .attr("in", "whiteColor")
        .attr("in2", "coloredBlur")
        .attr("operator", "in")
        .attr("result", "whiteBlur");
    
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
        
    const group = svg.append("g");
    const circleRadius = 50;
    const circle = svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", circleRadius)
        .style("fill", "#fffd7a")
        .style("filter", "url(#glow)");  

    data.forEach((d, i) => {
        const angle = (i / data.length) * 2 * Math.PI;  // Calculate angle for each line
        const lineLength = speedScale(d.speed);  
        const x1 = (width / 2) + (circleRadius-1) * Math.cos(angle);
        const y1 = (height / 2) + (circleRadius-1) * Math.sin(angle);
        const x2 = x1 + lineLength * Math.cos(angle);
        const y2 = y1 + lineLength * Math.sin(angle);

    group.append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .style("stroke", "yellow")
        .style("stroke-width", 1)
        .on("mouseover", function(event) {
            d3.select(this)  
            .style("stroke", "orange");

            d3.select("#tooltip")
                .interrupt()
                .style("display", "block")
                .style("opacity", 1) 
                .html(`Start Time: ${formatDate(new Date(d.startDate))}<br>Speed: ${d.speed}<br>Type: ${d.type}<br>Longitude: ${d.longitude}<br>Latitude: ${d.latitude}`)
                .style("left", (event.pageX + 10) + "px")  
                .style("top", (event.pageY - 10) + "px"); 
        })
        .on("mousemove", function(event, d) {
            d3.select("#tooltip").style("left", (event.pageX + 10) + "px")  
                .style("top", (event.pageY - 10) + "px");  
        })
        .on("mouseout", function() {
            d3.select(this)  
            .style("stroke", "yellow"); 

            d3.select("#tooltip")
                .transition()  
                .duration(500)  
                .style("opacity", 0) 
                .on("end", function() { 
                    d3.select("#tooltip").style("display", "none");  // hide the tooltip
                });
        });
        document.getElementById('loading').style.display = 'none';
    });

    let angle = 0;  
    let rotationSpeed = 0.05;  
    const maxRotationSpeed = 0.05; 
    let rotating = true;  
    const deceleration = 0.002;  
    // Function to update the rotation
    function update() {
        if (rotating) {  // Only update the angle if rotating is true
            rotationSpeed = Math.min(maxRotationSpeed, rotationSpeed + deceleration);
        }else {
            // If not rotating decelerate to 0
            rotationSpeed = Math.max(0, rotationSpeed - deceleration);
        }
        angle += rotationSpeed;
        group.attr("transform", `rotate(${angle}, ${width / 2}, ${height / 2})`);  
        requestAnimationFrame(update);  // Call update again
    }
    update();  // Start the animation

    svg.on("mousemove", function(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const dx = mouseX - width / 2;
        const dy = mouseY - height / 2;
        const distance = Math.sqrt(dx*dx + dy*dy);
        rotating = distance > circleRadius + 300;  
    });
    
}
