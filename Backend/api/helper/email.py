from django.core.mail import EmailMessage, get_connection
from django.template.loader import render_to_string
from django.conf import settings
from .helper import WaterQuality
from ..models import ReportLog

def report_log(success, e):
    if success:
        ReportLog.objects.create(
            description= "Email sent successfully: " + e,
            type= "System",
            success=success
        )
        return
    
    ReportLog.objects.create(
        description="Error sending email: " + str(e),
        type="System",
        success=success
    )
    

def send_upload_failed_notification(station, sensor, time, value, reason):
    try:
        html_message = render_to_string('upload_failed.html', {
            'station': station,
            'sensor': sensor,
            'time': time.strftime("%Y-%m-%d %H:%M:%S"),
            'value': value,
            'reason': reason,
        })

        zepto_connection = get_connection(
            host='smtp.zeptomail.com',
            port=465,
            username = "emailapikey",
            password= "wSsVR61yrxLwDK57nGCrdbw/zFVTBVulQEV/0VHyuif/H/DK9cc5kkLMAFWgG6UYEzZoHWFD8e4qzhcGhmYMhtUpmAoJCSiF9mqRe1U4J3x17qnvhDzIV2pdkRGKLooJwwprnGNoFcor+g==",
            
        )
        
        msg = EmailMessage(
            subject= "❌ Upload Failed",
            body=html_message,
            from_email='noreply@projectlawa.org',
            to=['borgepaguirigan@gmail.com', 'senalmazora@gmail.com', 'cjdumlao14@gmail.com', 'jonalyne1221@gmail.com', 'jensenalmazora@gmail.com'],
            connection=zepto_connection
        )
        msg.content_subtype = "html"
        msg.send()


        report_log(True, "Upload Failed Notification")

        
    except Exception as e:
        print(f"Error sending no data alert email: {e}")
        report_log(False, e)


def send_upload_notification(station, sensor, time, value, classification):
    try:

        html_message = render_to_string('uploaded.html', {
            'station': station,
            'sensor': sensor,
            'time': time.strftime("%Y-%m-%d %H:%M:%S"),
            'classification': classification,
            'value': value,
        })
        
        zepto_connection = get_connection(
            host='smtp.zeptomail.com',
            port=465,
            username = "emailapikey",
            password= "wSsVR61yrxLwDK57nGCrdbw/zFVTBVulQEV/0VHyuif/H/DK9cc5kkLMAFWgG6UYEzZoHWFD8e4qzhcGhmYMhtUpmAoJCSiF9mqRe1U4J3x17qnvhDzIV2pdkRGKLooJwwprnGNoFcor+g==",
            
        )
        
        msg = EmailMessage(
            subject= "✅ New Data Uploaded",
            body=html_message,
            from_email='noreply@projectlawa.org',
            to=['borgepaguirigan@gmail.com', 'senalmazora@gmail.com', 'cjdumlao14@gmail.com', 'jonalyne1221@gmail.com', 'jensenalmazora@gmail.com'],
            connection=zepto_connection
        )
        msg.content_subtype = "html"
        msg.send()


        report_log(True, "New Upload Notification")

        
            
    except Exception as e:
        print(f"Error sending no data alert email: {e}")
        report_log(False, e)

                

def send_alert_email(sensor, value, time, station, classification):
    try:
        subject = f"⚠️ Water Quality Alert: {sensor.name} at Station {station}"
        
        html_message = render_to_string("bad_class.html", {
            "sensor": sensor,
            "station": station,
            "time": time.strftime("%B %d, %Y %I:%M %p"),
            "value": value,
            "classification": classification,
        })

        zepto_connection = get_connection(
            host='smtp.zeptomail.com',
            port=465,
            username = "emailapikey",
            password= "wSsVR61yrxLwDK57nGCrdbw/zFVTBVulQEV/0VHyuif/H/DK9cc5kkLMAFWgG6UYEzZoHWFD8e4qzhcGhmYMhtUpmAoJCSiF9mqRe1U4J3x17qnvhDzIV2pdkRGKLooJwwprnGNoFcor+g==",
            
        )
        
        msg = EmailMessage(
            subject= subject,
            body=html_message,
            from_email='noreply@projectlawa.org',
            to=['borgepaguirigan@gmail.com', 'senalmazora@gmail.com', 'cjdumlao14@gmail.com', 'jonalyne1221@gmail.com', 'jensenalmazora@gmail.com'],
            connection=zepto_connection
        )
        msg.content_subtype = "html"
        msg.send()

        report_log(True, "Water Quality Alert Email Sent")

    except Exception as e:
        print(f"Error sending no data alert email: {e}")
        report_log(False, e)



def send_no_data_alert(sensor, station, last_data_time):
    try:
        subject = f"🚨 No Data Alert: {sensor.name} at Station {station}"

        html_message = render_to_string("no_data.html", {
            "sensor": sensor,
            "station": station,
            "last_data_time": last_data_time.strftime("%B %d, %Y %I:%M %p") if last_data_time else "No Data Ever Received",
        })

        zepto_connection = get_connection(
            host='smtp.zeptomail.com',
            port=465,
            username = "emailapikey",
            password= "wSsVR61yrxLwDK57nGCrdbw/zFVTBVulQEV/0VHyuif/H/DK9cc5kkLMAFWgG6UYEzZoHWFD8e4qzhcGhmYMhtUpmAoJCSiF9mqRe1U4J3x17qnvhDzIV2pdkRGKLooJwwprnGNoFcor+g==",
            
        )
        
        msg = EmailMessage(
            subject= subject,
            body=html_message,
            from_email='noreply@projectlawa.org',
            to=['borgepaguirigan@gmail.com', 'senalmazora@gmail.com', 'cjdumlao14@gmail.com', 'jonalyne1221@gmail.com', 'jensenalmazora@gmail.com'],
            connection=zepto_connection
        )

        msg.content_subtype = "html"
        msg.send()

        report_log(True, "No Data Alert Email Sent")
    

    except Exception as e:
        print(f"Error sending no data alert email: {e}")
        report_log(False, e)