import http from 'k6/http';
import { sleep, check } from 'k6';

// const users = [
//     { username: 'testuser1', password: 'password1' },
//     { username: 'testuser2', password: 'password2' },
//     { username: 'testuser3', password: 'password3' },
//     { username: 'testuser4', password: 'password4' },
//     { username: 'testuser5', password: 'password5' },
// ];

// export let options = {
//     stages: [
//         { duration: '30s', target: 5 }, // 在30秒內漸增至5個虛擬用戶
//         { duration: '1m', target: 5 },  // 保持5個虛擬用戶1分鐘
//         { duration: '10s', target: 0 },  // 在10秒內減少至0個虛擬用戶
//     ],
// };

export let options = {
    stages: [
        { duration: '2m', target: 50 },    // 2分鐘內漸增至50用戶
        { duration: '3m', target: 200 },  // 10分鐘內增加到200用戶
        { duration: '1m', target: 200 },  // 保持200用戶2分鐘
        { duration: '3m', target: 0 },     // 5分鐘內減少到0用戶
    ],
};

export default function () {
    //const user = users[__VU - 1];

    // 1. 訪問商店首頁
    let res = http.get('http://localhost:8080/shop');
    check(res, { 'status was 200': (r) => r.status === 200 });
    sleep(10);

    // // 2. login
    // let loginRes = http.post('http://localhost:8080/wp-login.php', {
    //     log: user.username,
    //     pwd: user.password,
    //     'wp-submit': '登入',
    //     redirect_to: 'http://localhost:8080/shop',
    //     testcookie: '1',
    // });
    // //console.log(JSON.stringify(loginRes.cookies));
    // check(loginRes, {
    //     'has wordpress_logged_in cookie': (r) => {
    //         // get Cookies key
    //         const cookieNames = Object.keys(r.cookies);
    //
    //         // find 'wordpress_logged_in_'
    //         const loggedInCookie = cookieNames.find(name => name.startsWith('wordpress_logged_in_'));
    //
    //         // check exist
    //         return loggedInCookie && r.cookies[loggedInCookie].length > 0;
    //     }
    // });
    // sleep(1);
    //
    // // get Cookies
    // let cookies = loginRes.cookies;
    // let headers = {
    //     'Cookie': cookiesToHeader(cookies),
    // };

    // 瀏覽產品頁面
    res = http.get('http://localhost:8080/product/delicious_canned_food/');
    check(res, { 'status was 200': (r) => r.status === 200 });
    sleep(10);

    // // AJAX 方式添加到購物車
    // let ajaxRes = http.post('http://localhost:8080/?wc-ajax=add_to_cart', {
    //     product_id: '15',
    //     quantity: 1,
    // });
    // check(ajaxRes, { 'AJAX add to cart successful': (r) => r.status === 200 });

    // 模擬表單提交方式
    let formRes = http.post('http://localhost:8080/product/delicious_canned_food/', {
        'add-to-cart': '15',
        quantity: '1',
    });
    check(formRes, { 'Form add to cart successful': (r) => r.status === 200 });
    sleep(10);

    // 5. checkout
    res = http.get('http://localhost:8080/checkout/');
    //res = http.get('http://localhost:8080/checkout/', { headers });
    //console.log(res.body);
    check(res, { 'checkout page status was 200': (r) => r.status === 200 });
    sleep(10);

    // 6. 提交訂單 (使用 AJAX 方式)
    let nonceMatch = res.body.match(/<input[^>]*id=["']woocommerce_nonce_input["'][^>]*value=["']([^"']+)["']/i);
    let nonce = nonceMatch ? nonceMatch[1] : null;

    //console.log('Nonce value:', nonce);

    if (!nonce) {
        console.error('Failed to retrieve nonce value');
        return;
    }

    let checkoutData = {
        'ship_to_different_address': 'false', // 使用相同的地址接收帳單
        shipping_first_name: 'Guest',
        shipping_last_name: 'User',
        shipping_address_1: '123 Pet Street',
        shipping_address_2: '',
        shipping_city: 'Taipei',
        shipping_postcode: '110',
        shipping_country: 'TW',
        shipping_state: 'TPE', // 台灣無需填寫州
        billing_first_name: 'Guest',
        billing_last_name: 'User',
        billing_email: 'guestuser@yopmail.com',
        billing_phone: '1234567890',
        billing_address_1: '123 Pet Street',
        billing_address_2: '',
        billing_city: 'Taipei',
        billing_postcode: '110',
        billing_country: 'TW',
        billing_state: 'TPE', // 台灣無需填寫州
        billing_company: '',
        payment_method: 'cod', // 貨到付款作為示例
        'woocommerce-process-checkout-nonce': nonce,
        'terms': 'on',
        'terms-field': '1',
        'shipping_method[0]': 'free_shipping:1', // 添加有效的運送方式，需與 WooCommerce 設定相匹配
        'shipping_method[1]': 'flat_rate:1', // 嘗試添加多個運送選項
    };

    //res = http.post('http://localhost:8080/?wc-ajax=checkout', checkoutData, { headers });
    res = http.post('http://localhost:8080/?wc-ajax=checkout', checkoutData);
    //console.log(res.body);
    check(res, {
        'Checkout completed': (r) => r.status === 200 && r.body.includes('order-received'),
    });

    sleep(10); // 等待 1 秒，以模擬真實用戶行為


    // // 7. 登出或遺忘 cookie
    // let logoutRes = http.get('http://localhost:8080/wp-login.php?action=logout', { headers: { 'Cookie': cookiesToHeader(res.cookies) } });
    // check(logoutRes, { 'Logged out successfully': (r) => r.status === 200 });
}

// 將 Cookies 轉換為 HTTP 標頭
function cookiesToHeader(cookies) {
    let cookieArray = [];

    // 遍歷 cookie 名稱
    for (let name in cookies) {
        // 遍历每个 cookie 名下的所有对象
        cookies[name].forEach(cookie => {
            cookieArray.push(`${cookie.name}=${cookie.value}`);
        });
    }

    // 将所有 Cookie 拼接成以 "; " 分隔的字符串
    return cookieArray.join('; ');
}

// cookie example
// {
//     "wordpress_test_cookie": [
//     {
//         "name": "wordpress_test_cookie",
//         "value": "WP%20Cookie%20check",
//         "domain": "",
//         "path": "/",
//         "http_only": false,
//         "secure": false,
//         "max_age": 0,
//         "expires": -6795364578871
//     }
// ],
//     "wordpress_37d007a56d816107ce5b52c10342db37": [
//     {
//         "name": "wordpress_37d007a56d816107ce5b52c10342db37",
//         "value": "testuser3%7C1729444137%7CvBI05AhIIyBVM3Aflmg9FNNH4xjRYtoRH7wbiOD68fd%7C95a12efa47548fce81223400608dded2e09a8d41a2da3e3da957f9f98769e77f",
//         "domain": "",
//         "path": "/wp-content/plugins",
//         "http_only": true,
//         "secure": false,
//         "max_age": 0,
//         "expires": -6795364578871
//     },
//     {
//         "name": "wordpress_37d007a56d816107ce5b52c10342db37",
//         "value": "testuser3%7C1729444137%7CvBI05AhIIyBVM3Aflmg9FNNH4xjRYtoRH7wbiOD68fd%7C95a12efa47548fce81223400608dded2e09a8d41a2da3e3da957f9f98769e77f",
//         "domain": "",
//         "path": "/wp-admin",
//         "http_only": true,
//         "secure": false,
//         "max_age": 0,
//         "expires": -6795364578871
//     }
// ],
//     "wordpress_logged_in_37d007a56d816107ce5b52c10342db37": [
//     {
//         "name": "wordpress_logged_in_37d007a56d816107ce5b52c10342db37",
//         "value": "testuser3%7C1729444137%7CvBI05AhIIyBVM3Aflmg9FNNH4xjRYtoRH7wbiOD68fd%7C685e51284aa9195f7967be4d01562548b004a50cd93ff5182853942e02a7c242",
//         "domain": "",
//         "path": "/",
//         "http_only": true,
//         "secure": false,
//         "max_age": 0,
//         "expires": -6795364578871
//     }
// ],
//     "mailpoet_subscriber": [
//     {
//         "name": "mailpoet_subscriber",
//         "value": "%7B%22subscriber_id%22%3A4%7D",
//         "domain": "",
//         "path": "/",
//         "http_only": false,
//         "secure": false,
//         "max_age": 315360000,
//         "expires": 2044631337000
//     }
// ]

