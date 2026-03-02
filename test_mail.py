import smtplib
from email.mime.text import MIMEText

def test_smtp():
    gmail_user = 'bharatbyte.com@gmail.com'
    gmail_password = 'tueqcmqvisceqwuf'

    sent_from = gmail_user
    to = [gmail_user]
    body = 'Test OTP from VAANI: 654321'

    msg = MIMEText(body)
    msg['Subject'] = 'VAANI SMTP Test'
    msg['From'] = sent_from
    msg['To'] = gmail_user

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(gmail_user, gmail_password)
        server.sendmail(sent_from, to, msg.as_string())
        server.close()
        print('SUCCESS: Email sent successfully with the new password!')
    except Exception as e:
        print(f'FAILURE: {e}')

if __name__ == "__main__":
    test_smtp()
