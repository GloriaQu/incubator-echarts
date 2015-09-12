define(function(require) {
    'use strict';

    var zrUtil = require('zrender/core/util');
    var vector = require('zrender/core/vector');

    var elementList = ['splitLine', 'splitArea', 'axisLine', 'axisTick', 'axisLabel'];

    require('../coord/polar/polarCreator');

    require('../echarts').extendComponentView({

        type: 'radiusAxis',

        render: function (radiusAxisModel, ecModel, api) {
            this.group.clear();

            var polarModel = ecModel.getComponent('polar', radiusAxisModel.get('polarIndex'));
            var radiusAxis = radiusAxisModel.axis;
            var polar = polarModel.coordinateSystem;
            var ticksCoords = radiusAxis.getTicksCoords();
            var axisAngle = radiusAxisModel.get('axisAngle');
            var radiusExtent = radiusAxis.getExtent();
            zrUtil.each(elementList, function (name) {
                if (radiusAxisModel.get(name +'.show')) {
                    this['_' + name](radiusAxisModel, polar, axisAngle, radiusExtent, ticksCoords, api);
                }
            }, this);

            var z = radiusAxisModel.get('z');
            this.group.eachChild(function (child) {
                child.z = z;
            });
        },

        /**
         * @private
         */
        _axisLine: function (radiusAxisModel, polar, axisAngle, radiusExtent, ticksCoords, api) {
            var p1 = polar.coordToPoint([radiusExtent[0], axisAngle]);
            var p2 = polar.coordToPoint([radiusExtent[1], axisAngle]);
            var arc = new api.Line({
                shape: {
                    x1: p1[0],
                    y1: p1[1],
                    x2: p2[0],
                    y2: p2[1]
                },
                style: radiusAxisModel.getModel('axisLine.lineStyle').getLineStyle()
            });

            this.group.add(arc);
        },

        /**
         * @private
         */
        _axisTick: function (radiusAxisModel, polar, axisAngle, radiusExtent, ticksCoords, api) {
            var tickModel = radiusAxisModel.getModel('axisTick');

            var start = polar.coordToPoint([radiusExtent[0], axisAngle]);
            var end = polar.coordToPoint([radiusExtent[1], axisAngle]);

            var len = vector.dist(end, start);
            var direction = [
                end[1] - start[1],
                start[0] - end[0]
            ];
            vector.normalize(direction, direction);

            var p1 = [];
            var p2 = [];
            var tickLen = tickModel.get('length');
            var lines = zrUtil.map(ticksCoords, function (tickPosition) {
                // Get point on axis
                vector.lerp(p1, start, end, tickPosition / len);
                vector.scaleAndAdd(p2, p1, direction, tickLen);
                return new api.Line({
                    shape: {
                        x1: p1[0],
                        y1: p1[1],
                        x2: p2[0],
                        y2: p2[1]
                    }
                });
            });
            this.group.add(api.mergePath(
                lines, {
                    style: tickModel.getModel('lineStyle').getLineStyle(),
                    silent: true
                }
            ));
        },

        /**
         * @private
         */
        _axisLabel: function (radiusAxisModel, polar, axisAngle, radiusExtent, ticksCoords, api) {
            var axis = radiusAxisModel.axis;
            var labelModel = radiusAxisModel.getModel('axisLabel');
            var textStyleModel = labelModel.getModel('textStyle');

            var labels = radiusAxisModel.formatLabels(axis.scale.getTicksLabels());

            var start = polar.coordToPoint([radiusExtent[0], axisAngle]);
            var end = polar.coordToPoint([radiusExtent[1], axisAngle]);

            var len = vector.dist(end, start);
            var direction = [
                start[1] - end[1],
                end[0] - start[0]
            ];
            vector.normalize(direction, direction);

            var p = [];
            var labelMargin = labelModel.get('margin');
            var labelsPositions = axis.getLabelsCoords();

            // FIXME Text align and text baseline when axis angle is 90 degree
            for (var i = 0; i < labelsPositions.length; i++) {
                // Get point on axis
                vector.lerp(p, start, end, labelsPositions[i] / len);
                vector.scaleAndAdd(p, p, direction, labelMargin);
                this.group.add(new api.Text({
                    style: {
                        x: p[0],
                        y: p[1],
                        text: labels[i],
                        textAlign: 'center',
                        textBaseline: 'top',
                        font: textStyleModel.getFont()
                    },
                    silent: true
                }));
            };
        },

        /**
         * @private
         */
        _splitLine: function (radiusAxisModel, polar, axisAngle, radiusExtent, ticksCoords, api) {
            var splitLineModel = radiusAxisModel.getModel('splitLine');
            var lineStyleModel = splitLineModel.getModel('lineStyle');
            var lineColors = lineStyleModel.get('color');
            var lineWidth = lineStyleModel.get('width');
            var lineCount = 0;

            lineColors = lineColors instanceof Array ? lineColors : [lineColors];

            var splitLines = [];

            for (var i = 0; i < ticksCoords.length; i++) {
                var colorIndex = (lineCount++) % lineColors.length;
                splitLines[colorIndex] = splitLines[colorIndex] || [];
                splitLines[colorIndex].push(new api.Circle({
                    shape: {
                        cx: polar.cx,
                        cy: polar.cy,
                        r: ticksCoords[i]
                    },
                    silent: true
                }))
            }

            // Simple optimization
            // Batching the lines if color are the same
            for (var i = 0; i < splitLines.length; i++) {
                this.group.add(api.mergePath(splitLines[i], {
                    style: {
                        stroke: lineColors[i % lineColors.length],
                        lineType: lineStyleModel.getLineDash(),
                        lineWidth: lineWidth,
                        fill: null
                    },
                    silent: true
                }));
            }
        },

        /**
         * @private
         */
        _splitArea: function (radiusAxisModel, polar, axisAngle, radiusExtent, ticksCoords, api) {

        }
    });
});