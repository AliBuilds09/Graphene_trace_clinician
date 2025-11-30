using GrapheneTraceApp.Api.Models;
using GrapheneTraceApp.Api.Data;

namespace GrapheneTraceApp.Api.Services
{
    public class AlertService
    {
        private readonly ApplicationDbContext _context;

        public AlertService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Checks latest measurement and creates alert if pressure is high
        public async Task CheckAndGenerateAlertAsync(int patientId)
        {
            var latestMeasurement = _context.Measurements
                .Where(m => m.PatientID == patientId)
                .OrderByDescending(m => m.MeasuredAt)
                .FirstOrDefault();

            if (latestMeasurement == null) return;

            // Thresholds (customize as needed)
            const decimal highPressureThreshold = 150.0m;
            const decimal criticalThreshold = 180.0m;

            if (latestMeasurement.PeakPressure >= criticalThreshold)
            {
                var alert = new Alert
                {
                    PatientID = patientId,
                    PressureValue = latestMeasurement.PeakPressure,
                    Message = $"Critical pressure detected: {latestMeasurement.PeakPressure} mmHg",
                    IsCritical = true
                };
                _context.Alerts.Add(alert);
            }
            else if (latestMeasurement.PeakPressure >= highPressureThreshold)
            {
                var alert = new Alert
                {
                    PatientID = patientId,
                    PressureValue = latestMeasurement.PeakPressure,
                    Message = $"High pressure detected: {latestMeasurement.PeakPressure} mmHg",
                    IsCritical = false
                };
                _context.Alerts.Add(alert);
            }

            await _context.SaveChangesAsync();
        }
    }
}