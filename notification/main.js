const Emails = require('../email/email-list').EmailPromise;
const Emailer = require('../email/email');
const { ErrorHandler } = require('./../error/main');
const { CMS } = require('./../cms/main');

const NotificationType = {
  ContactUs: 1,
  NewLetterSubscriber: 2,
  UserRegistered: 3,
  HighSeverityErrorOccured: 4,
  ResourceReviewAdded: 5
};

const pushNotification = (data) => {
  const siteName = CMS.getInstance().sitename;
  const siteURL = CMS.getInstance().getFrontendURL();

  Emails.then((emails) => {
    switch (data.notificationType) {
      case NotificationType.ContactUs:
        Emailer.sendMail({
          from: emails.noreplyName + ' <' + emails.noreply + '>',
          sender: emails.noreplyName,
          replyTo: data.notificationData.email,
          to: emails.emailList,
          subject: 'You have a new Contact Us submission for ' + siteName + ' by ' + data.notificationData.name,
          html: `<h3>Hello, You have a new Contact Us submission for <a href="${siteURL}">${siteName}</a> by ${data.notificationData.name}</h3>
          <p>There subject is: ${data.notificationData.subject}</p>
          <p>There message is: ${data.notificationData.message}</p>
          <p>If you wish to get back to them, please contact them on this email id: ${data.notificationData.email}</p>
          <p>Note: this is a system generated email, however you can still reply to this email to reach out to ${data.notificationData.name}</p>
          <p>Regards,<br/>Team ${siteName}</p>
          `
        }, (resp) => {
        }, (err) => {
          console.log('error sending email ', err.toString());
          ErrorHandler.logError(err);
        });
        break;
      case NotificationType.NewLetterSubscriber:
        Emailer.sendMail({
          from: emails.noreplyName + ' <' + emails.noreply + '>',
          sender: emails.noreplyName,
          replyTo: data.notificationData.email,
          to: emails.emailList,
          subject: 'You have a new news letter subscription for ' + siteName + ' by ' + data.notificationData.email,
          html: `<h3>Hello, You have a new news letter subscription for <a href="${siteURL}">${siteName}</a> by ${data.notificationData.email}</h3>
            <p>They would like to get any public updates or notifications as ${siteName} does any public announcement.</p>
            <p>Note: this is a system generated email, however you can still reply to this email to reach out to ${data.notificationData.email}</p>
            <p>Regards,<br/>Team ${siteName}</p>
            `
        }, (resp) => {
        }, (err) => {
          console.log('error sending email ', err.toString());
          ErrorHandler.logError(err);
        });
        break;
      case NotificationType.UserRegistered:
        Emailer.sendMail({
          from: emails.noreplyName + ' <' + emails.noreply + '>',
          sender: emails.noreplyName,
          replyTo: data.notificationData.email,
          to: emails.devsEmailList,
          subject: 'New Admin user was registered for ' + siteName + ' by email ' + data.notificationData.email,
          html: `<h3>Hello, You have a new admin user registered for <a href="${siteURL}">${siteName}</a> by name ${data.notificationData.fName} ${data.notificationData.lName}</h3>
          <p>If this was done by mistake and If you want to take immediate action on this, feel free to contact here:</p>
          <p>${emails.devsEmailList.join(', ')}</p>
          <p>Or user may login from here: <a href="${siteURL}/admin/login">${siteName} Admin</a></p>
          <p>Regards,<br/>Team ${siteName}</p>
              `
        }, (resp) => {
        }, (err) => {
          console.log('error sending email ', err.toString());
          ErrorHandler.logError(err);
        });

        Emailer.sendMail({
          from: emails.noreplyName + ' <' + emails.noreply + '>',
          sender: emails.noreplyName,
          to: data.notificationData.email,
          subject: 'Your account was successfully created for ' + siteName + ' Admin by email address ' + data.notificationData.email,
          html: `
          <p>Hello ${data.notificationData.fName},</p>
          <h4>Your account was successfully created for <a href="${siteURL}/admin/login">${siteName} Admin</a></h4>
          <p>You have access to Admin dashboard and you can check out analytics for ${siteName}.</p>
          <p>You may login using Email: ${data.notificationData.email} and password which you used while registration.</p>
          <p>Regards,<br/>Team ${siteName}</p>
              `
        }, (resp) => {
        }, (err) => {
          console.log('error sending email ', err.toString());
          ErrorHandler.logError(err);
        });
        break;
      case NotificationType.HighSeverityErrorOccured:
        Emailer.sendMail({
          from: emails.noreplyName + ' <' + emails.noreply + '>',
          sender: emails.noreplyName,
          to: emails.devsEmailList,
          subject: 'There was a high severity error on ' + siteName,
          html: `<h3>Hello, Sorry to inform you but, There was a high severity error on <a href="${siteURL}">${siteName}</a></h3>
              <p>Type: Error</p>
              <p>Severity: ${data.notificationData.severity}</p>
              <p>
              Error Message: ${data.notificationData.logmessage}
              <br/>
              Error Stack: ${data.notificationData.logstack}
              </p>
              <p>Note: this is a system generated email.</p>
              <p>Regards,<br/>Team ${siteName}</p>
              `
        }, (resp) => {
        }, (err) => {
          console.log('error sending email ', err.toString());
          ErrorHandler.logError(err);
        });
        break;
      case NotificationType.ResourceReviewAdded:
        Emailer.sendMail({
          from: emails.noreplyName + ' <' + emails.noreply + '>',
          sender: emails.noreplyName,
          to: emails.emailList,
          subject: 'You have a new review on your Product in ' + siteName + ' by ' + data.notificationData.fullname,
          html: `<h3>Hello, You have a new review on one of your Products in <a href="${siteURL}">${siteName}</a></h3>
                <p>
                Name: ${data.notificationData.fullname}
                <br/>
                Email: ${data.notificationData.email}
                <br/>
                Product Id: ${data.notificationData.resourceid}
                <br/>
                They have rated this product ${data.notificationData.rating} out of 5
                <br/>
                Visitor's Review: ${data.notificationData.message}
                </p>
                <p>
                <a href="${siteURL}/admin/request?type=approvereview&reviewid=${data.notificationData.id}">Click here</a> to approve this review so it will
                visible publically on your site.
                </br>
                Make sure you are logged in to admin panel to approve this review,
                if you face any error you will just need login again and click this link
                </p>
                <p>Note: this is a system generated email.</p>
                <p>Regards,<br/>Team ${siteName}</p>
                `
        }, (resp) => {
        }, (err) => {
          console.log('error sending email ', err.toString());
          ErrorHandler.logError(err);
        });
        break;
    }
  });
};

module.exports = { NotificationType, pushNotification };