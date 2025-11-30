using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using GrapheneTraceApp.Api.Models;
using GrapheneTraceApp.Api.Data;

namespace GrapheneTraceApp.Api.Services
{
    public class CsvProcessor
    {
        private readonly ApplicationDbContext _context;

        public CsvProcessor(ApplicationDbContext context)
        {
            _context = context;
        }

        // Processes CSV file and saves frames/KPIs to DB
        public async Task ProcessCsvAsync(int patientId, Stream csvStream)
        {
            var frames = new List<Frame>();
            var kpis = new List<KPI>();

            using (var reader = new StreamReader(csvStream))
            using (var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)))
            {
                // Assume CSV has rows of 32 comma-separated values (pressure data)
                var records = csv.GetRecords<dynamic>().ToList();

                foreach (var record in records)
                {
                    // Extract 32x32 grid from CSV row (adjust based on your CSV format)
                    var grid = new decimal[32, 32];
                    var rowData = ((IDictionary<string, object>)record).Values.Select(v => Convert.ToDecimal(v)).ToArray();

                    if (rowData.Length != 1024) continue; // 32x32 = 1024 values

                    for (int i = 0; i < 32; i++)
                    {
                        for (int j = 0; j < 32; j++)
                        {
                            grid[i, j] = rowData[i * 32 + j];
                        }
                    }

                    // Calculate KPIs
                    var peakPressure = grid.Cast<decimal>().Max();
                    var avgPressure = grid.Cast<decimal>().Average();
                    var lowPressure = grid.Cast<decimal>().Min();
                    var contactArea = grid.Cast<decimal>().Count(v => v > 0) / 1024.0m * 100; // Percentage

                    // Create Measurement
                    var measurement = new Measurement
                    {
                        PatientID = patientId,
                        PeakPressure = peakPressure,
                        ContactArea = contactArea,
                        LowPressure = lowPressure,
                        AvgPressure = avgPressure,
                        MeasuredAt = DateTime.Now
                    };
                    _context.Measurements.Add(measurement);
                    await _context.SaveChangesAsync(); // Save to get MeasurementID

                    // Create Frame (store grid as JSON)
                    var frameData = Newtonsoft.Json.JsonConvert.SerializeObject(grid);
                    var frame = new Frame
                    {
                        MeasurementID = measurement.MeasurementID,
                        FrameData = frameData
                    };
                    frames.Add(frame);

                    // Create KPI
                    var kpi = new KPI
                    {
                        MeasurementID = measurement.MeasurementID,
                        PeakPressure = peakPressure,
                        ContactArea = contactArea,
                        LowPressure = lowPressure,
                        AvgPressure = avgPressure
                    };
                    kpis.Add(kpi);
                }
            }

            _context.Frames.AddRange(frames);
            _context.KPIs.AddRange(kpis);
            await _context.SaveChangesAsync();
        }
    }
}