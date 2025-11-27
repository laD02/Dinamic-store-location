// app/utils/emailHelper.ts

export function openSupportEmail() {
  const subject = encodeURIComponent("Support Request from Shopify App");
  const body = encodeURIComponent(`Hello,

I need assistance with:

[Please describe your issue or question here]

App Information:
- Store: ${window.location.hostname}
- Date: ${new Date().toLocaleDateString('en-GB')}
- Time: ${new Date().toLocaleTimeString('en-GB')}

Thank you!`);
  
  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=h1-store-locator@h1-web-development.helpscoutapp.com&su=${subject}&body=${body}`;
  
  window.open(
    url, 
    'emailPopup', 
    'width=600,height=700,left=200,top=100,resizable=yes,scrollbars=yes'
  );
}