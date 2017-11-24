function drawDaysUnderQuota(divId) {
    Highcharts.chart(divId, {
        title: {text: null},
        chart: {
            type: 'heatmap',
            marginTop: 40,
            marginBottom: 80,
            plotBorderWidth: 1
        },

        // xAxis: {
        //     categories: ['Alexander', 'Marie', 'Maximilian', 'Sophia', 'Lukas', 'Maria', 'Leon', 'Anna', 'Tim', 'Laura']
        // },

        yAxis: {
            categories: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            title: null
        },

        colorAxis: {
            showInLegend: false,
            min: 0,
            minColor: '#FFFFFF',
            maxColor: Highcharts.getOptions().colors[0]
        },

        tooltip: {
            formatter: function () {
                return '<b>' + this.series.xAxis.categories[this.point.x] + '</b> sold <br><b>' +
                    this.point.value + '</b> items on <br><b>' + this.series.yAxis.categories[this.point.y] + '</b>';
            }
        },

        credits: {
            enabled: false
        },

        series: [{
            name: 'Sales per employee',
            borderWidth: 1,
            data: [
                [0, 0, 10], [0, 1, 19], [0, 2, 88], [0, 3, 24], [0, 4, 67], [0, 5, 67], [0, 6, 67],
                [1, 0, 92], [1, 1, 58], [1, 2, 78], [1, 3, 11], [1, 4, 48], [1, 5, 67], [1, 6, 67],
                [2, 0, 35], [2, 1, 15], [2, 2, 12], [2, 3, 64], [2, 4, 52], [2, 5, 67], [2, 6, 67],
                [3, 0, 72], [3, 1, 13], [3, 2, 11], [3, 3, 19], [3, 4, 16], [3, 5, 67], [3, 6, 67],
                [4, 0, 38], [4, 1, 58], [4, 2, 88], [4, 3, 11], [4, 4, 11], [4, 5, 67], [4, 6, 67],
                [5, 0, 88], [5, 1, 32], [5, 2, 12], [5, 3, 68], [5, 4, 12], [5, 5, 67], [5, 6, 67],
                [6, 0, 13], [6, 1, 44], [6, 2, 88], [6, 3, 98], [6, 4, 96], [6, 5, 67], [6, 6, 67],
                [7, 0, 31], [7, 1, 18], [7, 2, 82], [7, 3, 32], [7, 4, 30], [7, 5, 67], [7, 6, 67],
                [8, 0, 85], [8, 1, 97], [8, 2, 12], [8, 3, 64], [8, 4, 84], [8, 5, 67], [8, 6, 67],
                [9, 0, 47], [9, 1, 11], [9, 2, 31], [9, 3, 48], [9, 4, 91], [9, 5, 67], [9, 6, 67],
                [10, 0, 10], [10, 1, 19], [10, 2, 88], [10, 3, 24], [10, 4, 67], [10, 5, 67], [10, 6, 67],
                [11, 0, 92], [11, 1, 58], [11, 2, 78], [11, 3, 11], [11, 4, 48], [11, 5, 67], [11, 6, 67],
                [12, 0, 35], [12, 1, 15], [12, 2, 12], [12, 3, 64], [12, 4, 52], [12, 5, 67], [12, 6, 67],
                [13, 0, 72], [13, 1, 13], [13, 2, 11], [13, 3, 19], [13, 4, 16], [13, 5, 67], [13, 6, 67],
                [14, 0, 38], [14, 1, 58], [14, 2, 88], [14, 3, 11], [14, 4, 11], [14, 5, 67], [14, 6, 67],
                [15, 0, 88], [15, 1, 32], [15, 2, 12], [15, 3, 68], [15, 4, 12], [15, 5, 67], [15, 6, 67],
                [16, 0, 13], [16, 1, 44], [16, 2, 88], [16, 3, 98], [16, 4, 96], [16, 5, 67], [16, 6, 67],
                [17, 0, 31], [17, 1, 18], [17, 2, 82], [17, 3, 32], [17, 4, 30], [17, 5, 67], [17, 6, 67],
                [18, 0, 85], [18, 1, 97], [18, 2, 12], [18, 3, 64], [18, 4, 84], [18, 5, 67], [18, 6, 67],
                [19, 0, 47], [19, 1, 11], [19, 2, 31], [19, 3, 48], [19, 4, 91], [19, 5, 67], [19, 6, 67],
                [20, 0, 10], [20, 1, 19], [20, 2, 88], [20, 3, 24], [20, 4, 67], [20, 5, 67], [20, 6, 67],
                [21, 0, 92], [21, 1, 58], [21, 2, 78], [21, 3, 11], [21, 4, 48], [21, 5, 67], [21, 6, 67],
                [22, 0, 35], [22, 1, 15], [22, 2, 12], [22, 3, 64], [22, 4, 52], [22, 5, 67], [22, 6, 67],
                [23, 0, 72], [23, 1, 13], [23, 2, 11], [23, 3, 19], [23, 4, 16], [23, 5, 67], [23, 6, 67],
                [24, 0, 38], [24, 1, 58], [24, 2, 88], [24, 3, 11], [24, 4, 11], [24, 5, 67], [24, 6, 67],
                [25, 0, 88], [25, 1, 32], [25, 2, 12], [25, 3, 68], [25, 4, 12], [25, 5, 67], [25, 6, 67],
                [26, 0, 13], [26, 1, 44], [26, 2, 88], [26, 3, 98], [26, 4, 96], [26, 5, 67], [26, 6, 67],
                [27, 0, 31], [27, 1, 18], [27, 2, 82], [27, 3, 32], [27, 4, 30], [27, 5, 67], [27, 6, 67],
                [28, 0, 85], [28, 1, 97], [28, 2, 12], [28, 3, 64], [28, 4, 84], [28, 5, 67], [28, 6, 67],
                [29, 0, 47], [29, 1, 11], [29, 2, 31], [29, 3, 48], [29, 4, 91], [29, 5, 67], [29, 6, 67],
                [30, 0, 10], [30, 1, 19], [30, 2, 88], [30, 3, 24], [30, 4, 67], [30, 5, 67], [30, 6, 67],
                [31, 0, 92], [31, 1, 58], [31, 2, 78], [31, 3, 11], [31, 4, 48], [31, 5, 67], [31, 6, 67],
                [32, 0, 35], [32, 1, 15], [32, 2, 12], [32, 3, 64], [32, 4, 52], [32, 5, 67], [32, 6, 67],
                [33, 0, 72], [33, 1, 13], [33, 2, 11], [33, 3, 19], [33, 4, 16], [33, 5, 67], [33, 6, 67],
                [34, 0, 38], [34, 1, 58], [34, 2, 88], [34, 3, 11], [34, 4, 11], [34, 5, 67], [34, 6, 67],
                [35, 0, 88], [35, 1, 32], [35, 2, 12], [35, 3, 68], [35, 4, 12], [35, 5, 67], [35, 6, 67],
                [36, 0, 13], [36, 1, 44], [36, 2, 88], [36, 3, 98], [36, 4, 96], [36, 5, 67], [36, 6, 67],
                [37, 0, 31], [37, 1, 18], [37, 2, 82], [37, 3, 32], [37, 4, 30], [37, 5, 67], [37, 6, 67],
                [38, 0, 85], [38, 1, 97], [38, 2, 12], [38, 3, 64], [38, 4, 84], [38, 5, 67], [38, 6, 67],
                [39, 0, 47], [39, 1, 11], [39, 2, 31], [39, 3, 48], [39, 4, 91], [39, 5, 67], [39, 6, 67],
                [40, 0, 10], [40, 1, 19], [40, 2, 88], [40, 3, 24], [40, 4, 67], [40, 5, 67], [40, 6, 67],
                [41, 0, 92], [41, 1, 58], [41, 2, 78], [41, 3, 11], [41, 4, 48], [41, 5, 67], [41, 6, 67],
                [42, 0, 35], [42, 1, 15], [42, 2, 12], [42, 3, 64], [42, 4, 52], [42, 5, 67], [42, 6, 67],
                [43, 0, 72], [43, 1, 13], [43, 2, 11], [43, 3, 19], [43, 4, 16], [43, 5, 67], [43, 6, 67],
                [44, 0, 38], [44, 1, 58], [44, 2, 88], [44, 3, 11], [44, 4, 11], [44, 5, 67], [44, 6, 67],
                [45, 0, 88], [45, 1, 32], [45, 2, 12], [45, 3, 68], [45, 4, 12], [45, 5, 67], [45, 6, 67],
                [46, 0, 13], [46, 1, 44], [46, 2, 88], [46, 3, 98], [46, 4, 96], [46, 5, 67], [46, 6, 67],
                [47, 0, 31], [47, 1, 18], [47, 2, 82], [47, 3, 32], [47, 4, 30], [47, 5, 67], [47, 6, 67],
                [48, 0, 85], [48, 1, 97], [48, 2, 12], [48, 3, 64], [48, 4, 84], [48, 5, 67], [48, 6, 67],
                [49, 0, 47], [49, 1, 11], [49, 2, 31], [49, 3, 48], [49, 4, 91], [49, 5, 67], [49, 6, 67],
                [50, 0, 47], [50, 1, 11], [50, 2, 31], [50, 3, 48], [50, 4, 91], [50, 5, 67], [50, 6, 67],
                [51, 0, 47], [51, 1, 11], [51, 2, 31], [51, 3, 48], [51, 4, 91], [51, 5, 67], [51, 6, 67]],

            dataLabels: {
                enabled: false,
            }
        }]

    });
}
