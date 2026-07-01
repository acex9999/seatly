const PRODUCT_LINK = 'wKSXy';
const VERIFY_V2_URL = 'https://payhip.com/api/v2/license/verify';
const VERIFY_V1_URL = 'https://payhip.com/api/v1/license/verify';

export async function onRequest({request, env}) {
  if(request.method === 'OPTIONS') return json({ok:true});
  if(request.method !== 'POST') return json({valid:false, message:'Method not allowed.'}, 405);

  const productSecretKey = env.PAYHIP_PRODUCT_SECRET_KEY;
  const legacyApiKey = env.PAYHIP_API_KEY;
  if(!productSecretKey && !legacyApiKey) return json({valid:false, message:'License server is not configured yet.'}, 500);

  let body;
  try{
    body = await readBody(request);
  }catch{
    return json({valid:false, message:'Invalid request.'}, 400);
  }

  const licenseKey = String(body.license_key || body.licenseKey || '').trim();
  if(!licenseKey) return json({valid:false, message:'License key is required.'}, 400);

  const url = new URL(productSecretKey ? VERIFY_V2_URL : VERIFY_V1_URL);
  url.searchParams.set('license_key', licenseKey);
  if(!productSecretKey) url.searchParams.set('product_link', PRODUCT_LINK);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try{
    const response = await fetch(url.toString(), {
      method:'GET',
      headers:{
        'accept':'application/json',
        ...(productSecretKey ? {'product-secret-key':productSecretKey} : {'payhip-api-key':legacyApiKey})
      },
      signal:controller.signal
    });
    const data = await parseJson(response);
    if(!response.ok && response.status < 500) {
      return json({valid:false, message:'Key invalid, please check or contact support.'});
    }
    if(!response.ok) return json({valid:false, message:'Payhip could not verify this key. Please try again.'}, 502);

    const license = data && data.data ? data.data : data;
    const enabled = license && license.enabled === true;
    const sameProduct = !license.product_link || license.product_link === PRODUCT_LINK;
    const valid = enabled && sameProduct;

    return json({
      valid,
      message:valid ? 'License verified.' : 'Key invalid, please check or contact support.'
    });
  }catch(error){
    const timedOut = error && error.name === 'AbortError';
    return json({valid:false, message:timedOut ? 'License check timed out. Please try again.' : 'License check failed. Please try again.'}, 502);
  }finally{
    clearTimeout(timeout);
  }
}

async function readBody(request){
  const type = request.headers.get('content-type') || '';
  if(type.includes('application/json')) return await request.json();
  if(type.includes('form')) return Object.fromEntries(await request.formData());
  return {};
}

async function parseJson(response){
  const text = await response.text();
  if(!text) return {};
  try{
    return JSON.parse(text);
  }catch{
    return {};
  }
}

function json(payload, status = 200){
  return new Response(JSON.stringify(payload), {
    status,
    headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store'
    }
  });
}
