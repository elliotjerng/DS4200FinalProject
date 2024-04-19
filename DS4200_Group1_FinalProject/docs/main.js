// Define chart dimensions and margins
const margin = { top: 100, right: 100, bottom: 40, left: 150 };
const width = 1000;
const height = 600;

// Append SVG to the chart div
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Define inner width and height
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// Load the CSV data
d3.csv("/../suicides_data.csv").then(data => {
    // Process the data
    const processData = (country) => {
        // Filter data based on selected country and last 5 years
        const filteredData = data.filter(d => d.country === country && parseInt(d.year) >= 2005);

        // Convert filtered data to an array of objects with generation, gender, and suicides_no attributes
        const result = filteredData.map(d => ({
            generation: d.generation,
            gender: d.sex,
            suicides_no: +d.suicides_no
        }));

        // Group data by generation and gender
        const groupedData = result.reduce((acc, cur) => {
            const key = cur.generation + '_' + cur.gender;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(cur.suicides_no);
            return acc;
        }, {});

        // Convert the grouped data object to an array of objects
        const aggregatedData = Object.entries(groupedData).map(([key, suicides]) => {
            const [generation, gender] = key.split('_');
            return {
                generation,
                gender,
                suicides_no: d3.sum(suicides)
            };
        });

        return aggregatedData;
    };

    // Initialize chart with default country
    const defaultCountry = "United States";
    updateChart(defaultCountry);

    // Function to update the chart based on selected country
    function updateChart(country) {
        const processedData = processData(country);

    // Define the desired order of generations for the x-axis
    const generationOrder = ["G.I. Generation", "Silent", "Boomers", "Generation X", "Millenials", "Generation Z"];

    // Define x and y scales
    const xScale = d3.scaleBand()
        .domain(generationOrder) // Specify the desired order
        .range([margin.left, innerWidth + margin.left])
        .padding(0.1);


        const yScale = d3.scaleLinear()
            .domain([0, d3.max(processedData, d => d.suicides_no)])
            .range([innerHeight + margin.top, margin.top]);

        // Draw x and y axes
        svg.selectAll(".x-axis").remove();
        svg.selectAll(".y-axis").remove();
        svg.selectAll(".barGroup").remove();
        svg.selectAll(".bar").remove();
        svg.selectAll(".title").remove();

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${innerHeight + margin.top})`)
            .call(xAxis);

        const yAxis = d3.axisLeft(yScale);
        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yAxis);

        // Draw bars
        const barGroups = svg.selectAll(".barGroup")
            .data(processedData)
            .enter()
            .append("g")
            .attr("class", "barGroup")
            .attr("transform", d => `translate(${xScale(d.generation)}, 0)`);

        barGroups.selectAll(".bar")
            .data(d => [d])
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => {
                if (d.gender === "male") return 0;
                else return xScale.bandwidth() / 2; // Shift for female bars
            })
            .attr("y", d => yScale(d.suicides_no))
            .attr("width", xScale.bandwidth() / 2)
            .attr("height", d => innerHeight + margin.top - yScale(d.suicides_no))
            .attr("fill", d => (d.gender === "male" ? "steelblue" : "pink"));

        // Add labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Generation");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", margin.left / 2)
            .attr("dy", "1em")
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Suicides");

        // Add legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - margin.right}, ${margin.top})`);

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "steelblue");

        legend.append("text")
            .attr("x", 30)
            .attr("y", 10)
            .attr("dy", "0.8em")
            .text("Male");

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 30)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "pink");

        legend.append("text")
            .attr("x", 30)
            .attr("y", 40)
            .attr("dy", "0.8em")
            .text("Female");

        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr('class', 'title')
            .attr("text-anchor", "middle")
            .style("font-size", "28px")
            .text(`Suicides by Generation and Gender in ${country}, 2005-2015`);
    }

    // Update chart when a different country is selected
    const countrySelector = document.createElement("select");
    const countries = Array.from(new Set(data.map(d => d.country)));
    countries.forEach(country => {
        const option = document.createElement("option");
        option.text = country;
        option.value = country;
        countrySelector.appendChild(option);
    });
    countrySelector.addEventListener("change", (event) => {
        updateChart(event.target.value);
    });
    document.body.insertBefore(countrySelector, document.getElementById("selector"));
});
