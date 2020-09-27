const CMSOne = require('./index');

// setup
process.env.NODE_ENV = 'local';
CMSOne.Main.setup({ get: () => { }, post: () => { }, put: () => { }, delete: () => { } }, {
  local: {
    MONGODB_CONNECTION: 'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false',
    HAS_CERT: false,
    DATABASE_NAME: 'cmsone',
    EMAILID: '',
    EMAIL_PASSWORD: ''
  }
});

// test PagesAPI -> getPageBasicDetailsById
try {
  const getPageBasicDetailsById = CMSOne.PagesAPI.getInstance().getPageBasicDetailsById('afeabcb5-1e6e-4ae0-94bc-8542f32e7ee7');
  getPageBasicDetailsById.then((data) => {
    console.log('01====START====');
    console.log('getPageBasicDetailsById', data);
    console.log('01=====END=====');
  }, (err) => {
    console.log('01====START====');
    console.log('Failed test: PagesAPI -> getPageBasicDetailsById', { details: err.stack });
    console.log('01=====END=====');
  });
} catch (err) {
  console.log('01====START====');
  console.log('Failed test: PagesAPI -> getPageBasicDetailsById', { details: err.stack });
  console.log('01=====END=====');
}

// test PageContentAPI -> getPageDetails
/* try {
  const getPageDetails = CMSOne.PageContentAPI.getInstance().getPageDetails('afeabcb5-1e6e-4ae0-94bc-8542f32e7ee7');
  getPageDetails.then((data) => {
    console.log('02====START====');
    console.log('getPageDetails', data);
    console.log('02=====END=====');
  }, (err) => {
    console.log('02====START====');
    console.log('Failed test: PageContentAPI -> getPageDetails', { details: err.stack });
    console.log('02=====END=====');
  });
} catch (err) {
  console.log('02====START====');
  console.log('Failed test: PageContentAPI -> getPageDetails', { details: err.stack });
  console.log('02=====END=====');
} */


// test PageContentAPI -> getPageByURL
try {
  const getPageByURL = CMSOne.PageContentAPI.getInstance().getPageByURL('/asdasd');
  getPageByURL.then((data) => {
    console.log('03====START====');
    console.log('getPageByURL', data);
    console.log('03=====END=====');
  }, (err) => {
    console.log('03====START====');
    console.log('Failed test: PageContentAPI -> getPageByURL', { details: err.stack });
    console.log('03=====END=====');
  });
} catch (err) {
  console.log('03====START====');
  console.log('Failed test: PageContentAPI -> getPageByURL', { details: err.stack });
  console.log('03=====END=====');
}
