const express = require('express');
const { param, query, validationResult } = require('express-validator');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const Reading = require('../models/Reading');
const Station = require('../models/Station');

const router = express.Router();

/**
 * @route   GET /api/export/:stationId
 * @desc    Export historical AQI records as CSV or PDF
 */
router.get(
  '/:stationId',
  async (req, res) => {
    try {
      let { stationId } = req.params;
      let format = req.query.format;
      let range = req.query.range || '7d';

      // Support both /api/export/:stationId?format=csv and /api/export/csv?stationId=...
      if (stationId === 'csv' || stationId === 'pdf') {
        format = stationId;
        stationId = req.query.stationId;
      }
      if (!format) format = 'csv';

      if (!stationId) {
        return res.status(400).json({ success: false, error: 'Station ID is required' });
      }

      let hours = 24;
      if (range === '7d') hours = 7 * 24;
      if (range === '30d') hours = 30 * 24;

      const station = await Station.findOne({ stationId });
      if (!station) {
        return res.status(404).json({ success: false, error: 'Station not found' });
      }

      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const readings = await Reading.find({ stationId, timestamp: { $gte: cutoff } })
        .sort({ timestamp: -1 })
        .lean();

      if (format === 'csv') {
        const fields = [
          { label: 'Timestamp (UTC)', value: r => new Date(r.timestamp).toISOString() },
          { label: 'Station Name', value: () => station.name },
          { label: 'City', value: () => station.city },
          { label: 'Overall AQI', value: 'aqi' },
          { label: 'Category', value: 'category' },
          { label: 'Dominant Pollutant', value: 'dominantPollutant' },
          { label: 'PM2.5 (ug/m3)', value: 'pollutants.pm25' },
          { label: 'PM10 (ug/m3)', value: 'pollutants.pm10' },
          { label: 'NO2 (ug/m3)', value: 'pollutants.no2' },
          { label: 'SO2 (ug/m3)', value: 'pollutants.so2' },
          { label: 'CO (mg/m3)', value: 'pollutants.co' },
          { label: 'O3 (ug/m3)', value: 'pollutants.o3' }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(readings);

        res.header('Content-Type', 'text/csv');
        res.attachment(`AQI_Report_${station.city}_${stationId}_${range}.csv`);
        return res.send(csv);
      }

      if (format === 'pdf') {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.header('Content-Type', 'application/pdf');
        res.attachment(`AQI_Report_${station.city}_${stationId}_${range}.pdf`);
        doc.pipe(res);

        // Header - Explicit coordinates to prevent text collisions
        doc.fillColor('#0f172a').fontSize(18).text('Air Quality Index Historical Audit Report', 40, 40);
        doc.fillColor('#64748b').fontSize(10).text(`Generated: ${new Date().toLocaleString()} | Range: ${range.toUpperCase()}`, 40, 66);

        // Station Details Box - Placed cleanly below header
        const boxY = 88;
        doc.rect(40, boxY, 515, 70).fillAndStroke('#f8fafc', '#e2e8f0');
        doc.fillColor('#1e293b').fontSize(12).text(`Station: ${station.name} (${station.city}, ${station.state || 'India'})`, 55, boxY + 12);
        doc.fontSize(10).fillColor('#475569').text(`Station ID: ${station.stationId} | Source: ${(station.source || 'CPCB').toUpperCase()}`, 55, boxY + 31);
        doc.text(`Current AQI: ${station.lastAqi || '--'} (${station.lastCategory || '--'}) | Dominant: ${(station.dominantPollutant || 'PM2.5').toUpperCase()}`, 55, boxY + 49);

        doc.y = boxY + 88;
        doc.x = 40;


        // Statistical Summary
        if (readings.length > 0) {
          const aqiValues = readings.map(r => r.aqi);
          const minAqi = Math.min(...aqiValues);
          const maxAqi = Math.max(...aqiValues);
          const avgAqi = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);

          doc.fillColor('#0f172a').fontSize(12).text('Summary Statistics:');
          doc.moveDown(0.3);
          doc.fontSize(10).fillColor('#334155');
          doc.text(`• Total Recorded Readings: ${readings.length}`);
          doc.text(`• Minimum AQI: ${minAqi}`);
          doc.text(`• Maximum AQI: ${maxAqi}`);
          doc.text(`• Average AQI: ${avgAqi}`);
          doc.moveDown(1);
        }

        // Table Header
        doc.fillColor('#0f172a').fontSize(11).text('Recent Historical Measurements:');
        doc.moveDown(0.5);

        let tableY = doc.y;
        doc.fillColor('#475569').fontSize(9);
        doc.text('Date / Time', 45, tableY);
        doc.text('AQI', 190, tableY);
        doc.text('Category', 240, tableY);
        doc.text('PM2.5', 360, tableY);
        doc.text('PM10', 420, tableY);
        doc.text('NO2', 480, tableY);
        doc.moveDown(0.5);

        doc.strokeColor('#cbd5e1').moveTo(40, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.4);

        // Table Rows (limit to first 25 for clean 1-2 page layout)
        const displayRows = readings.slice(0, 25);
        displayRows.forEach(r => {
          if (doc.y > 750) doc.addPage();
          const rowY = doc.y;
          const dt = new Date(r.timestamp).toISOString().replace('T', ' ').substring(0, 16);
          doc.fillColor('#1e293b').fontSize(8.5);
          doc.text(dt, 45, rowY);
          doc.text(String(r.aqi), 190, rowY);
          doc.text(r.category, 240, rowY);
          doc.text(String(r.pollutants?.pm25 || '-'), 360, rowY);
          doc.text(String(r.pollutants?.pm10 || '-'), 420, rowY);
          doc.text(String(r.pollutants?.no2 || '-'), 480, rowY);
          doc.moveDown(0.4);
        });

        doc.end();
      }
    } catch (err) {
      console.error('Export error:', err);
      res.status(500).json({ success: false, error: 'Failed to generate export file' });
    }
  }
);

module.exports = router;
