// Talks to the Blueprint Builder API on blueprintcode.ai (/api/builder). No state of its own.
// Every call resolves with the JSON body or rejects with an Error carrying .status and .data.
// available is false when the page is opened as a file, so the app stays device-only.
var Server = (function(){
'use strict';
var API = '/api/builder';
var available = location.protocol === 'http:' || location.protocol === 'https:';

function call(method, path, body){
  var opt = { method:method, credentials:'same-origin', headers:{ 'Accept':'application/json' } };
  if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  return fetch(API + path, opt).then(function(r){
    return r.json().catch(function(){ return {}; }).then(function(data){
      if (r.ok) return data;
      var e = new Error(data.error || (r.status === 404 ? 'Not found.' : 'Something went wrong. Try again.'));
      e.status = r.status; e.data = data; throw e;
    });
  }, function(){ var e = new Error("Couldn't reach Blueprint Code. Check your connection."); e.status = 0; throw e; });
}

return {
  available: available,
  me: function(){ return available ? call('GET', '/me') : Promise.resolve({ client:null, review:null }); },
  requestLink: function(email){ return call('POST', '/auth/request', { email:email }); },
  signOut: function(){ return call('POST', '/auth/sign-out', {}); },
  endReview: function(){ return call('POST', '/auth/end-review', {}); },
  list: function(){ return call('GET', '/projects'); },
  create: function(p){ return call('POST', '/projects', { project:p }); },
  load: function(id){ return call('GET', '/projects/' + encodeURIComponent(id)); },
  save: function(id, rev, p){ return call('PUT', '/projects/' + encodeURIComponent(id), { rev:rev, project:p }); },
  remove: function(id){ return call('DELETE', '/projects/' + encodeURIComponent(id)); },
  submit: function(id, rev){ return call('POST', '/projects/' + encodeURIComponent(id) + '/submit', { rev:rev }); },
  deleteAccount: function(){ return call('DELETE', '/account'); }
};
})();
