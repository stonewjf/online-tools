!function () {
    function e(e, t, a, r) {
        if (e === "hex" && a) {
                if (t.length === 128) {
                    t = "04" + t;
                }
            }
        return "pem_text" === e ? a ? KEYUTIL.getKey(t).pubKeyHex : KEYUTIL.getKey(t, r).prvKeyHex : "base64" === e ? b64tohex(t) : t
    }

    function t(e, t, a) {
        if (!a) throw "Invalid private key";
        var r = new KJUR.crypto.Signature({alg: t});
        return r.init(a), "string" == typeof e ? r.updateString(e) : r.updateHex(ot.bytesToHex(e)), r.sign()
    }

    function a(t, a, r, n, i, o) {
        try {
            if (!a) return "Public key is blank";

            if (!(i = e(n, i))) return "Signature key is blank";
            // 检查签名是否已经是 DER 格式
            if (!isDERFormat(i) && n === "hex") {
                // 如果签名是 r+s 格式，先转换为 DER 格式
                i = convertRStoDER(i);
            }
            
            var c = new KJUR.crypto.Signature({alg: r});
            return c.init(o), "string" == typeof t ? c.updateString(t) : c.updateHex(ot.bytesToHex(t)), c.verify(i) ? "Valid" : "Signature is invalid"
        } catch (e) {
            return e.message
        }
    }

    // 检查签名是否为 DER 格式
    function isDERFormat(signature) {
        // DER 格式的签名以 3045 开头
        return signature.startsWith("30");
    }

    
    function convertRStoDER(rsSignature) {
        // 假设 r+s 格式是两个相同长度的十六进制字符串拼接
        var rHex = rsSignature.substring(0, rsSignature.length / 2);
        var sHex = rsSignature.substring(rsSignature.length / 2);

        // 构造 ASN.1 DER 序列
        var derSequence = new KJUR.asn1.DERSequence({
            array: [
                new KJUR.asn1.DERInteger({ hex: rHex }),
                new KJUR.asn1.DERInteger({ hex: sHex })
            ]
        });

        // 获取 DER 编码的十六进制字符串
        return derSequence.getEncodedHex();
    }
    // 将十六进制字符串转换为字节数组
    function hexToBytes(hex) {
        var bytes = [];
        for (var c = 0; c < hex.length; c += 2) {
            bytes.push(parseInt(hex.substr(c, 2), 16));
        }
        return bytes;
    }

    function r(e, t, a, r, n) {
        var i, o, c = e.prvKeyObj, s = e.pubKeyObj;
        return "PKCS1" === t ? r = !1 : "PKCS5" === t ? r = !0 : a = void 0, o = r ? KEYUTIL.getPEM(c, t + "PRV", n, a) : KEYUTIL.getPEM(c, t + "PRV"), i = KEYUTIL.getPEM(s, "PKCS8PUB"), [o, i]
    }

    function n(e) {
        var t = e[0], a = e[1];
        return h.attr("href", "data:application/octet-stream;," + t), g.attr("href", "data:application/octet-stream;," + a), h.show(), g.show(), u.val(a), t
    }

    function i(e, t, a, i, o) {
        return n(r(e, t, a, i, o))
    }

    var o = window.Worker, c = {"2b81040006": "secp112r1", "2b8104001c": "secp128r1", "2a8648ce3d030101": "secp192r1"},
        s = {
            secp112r1: "1.3.132.0.6",
            secp128r1: "1.3.132.0.28",
            secp192r1: "1.2.840.10045.3.1.1",
            secp192k1: "1.3.132.0.31",
            secp224r1: "1.3.132.0.33"
        };
    window.ecdsa = {}, window.rsa = {}, ecdsa.sign = function (a, r, n, i, o, c) {
        return i = e(n, i, !1, c), t(a, o + "withECDSA", i && {d: i, curve: r})
    }, rsa.sign = function (e, a, r, n) {
        return t(e, r + "withRSA", KEYUTIL.getKey(a, n))
    }, ecdsa.verify = function (t, r, n, i, o, c, s) {
        return i = e(n, i, !0), a(t, i, o + "withECDSA", c, s, {xy: i, curve: r})
    }, rsa.verify = function (e, t, r, n, i) {
        return t = KEYUTIL.getKey(t), a(e, t, r + "withRSA", n, i, t)
    };
    var p = $("#output"), u = $("#public-key"), h = $("#download-image"), g = $("#download-public");
    h.attr("download", "private.pem"), ecdsa.generate = function (e, t, a, r, n, o, c) {
        u.val("");
        var s, p, f = KEYUTIL.generateKeypair("EC", t);
        if ("pem_text" === a) p = i(f, r, n, o, c); else {
            h.hide(), g.hide();
            var d = new KJUR.crypto.ECDSA({curve: t}), l = d.generateKeyPairHex();
            s = l.ecpubhex, p = l.ecprvhex, "base64" === a && (s = hextob64(s), p = hextob64(p)), u.val(s)
        }
        return p
    };
    var f;
    rsa.generate = function (e, t, a, r, c, s) {
        if (f && (f.terminate(), f = null), p.val("processing..."), u.val("processing..."), !(t < 512)) return new Promise(function (e) {
            o ? (f = new Worker("js/jsrsasign-worker.js"), f.onmessage = function (t) {
                f = null, e(n(t.data))
            }, f.postMessage({
                bits: t,
                format: a,
                cipher: r,
                passphraseEnabled: c,
                passphrase: s
            })) : setTimeout(function () {
                var n = KEYUTIL.generateKeypair("RSA", t);
                e(i(n, a, r, c, s).replace("\r\n\r\n-----END", "\r\n-----END"))
            })
        })
    };
    var d = $("#pem-format"), l = $("#cipher-algorithm-block"), b = $("#passpharse-wrap"),
        v = $("#passphrase-enabled-block"), y = $("#passphrase-enabled"), K = $("#passphrase-block");
    d.change(function () {
        var e = d.val();
        "PKCS8" === e ? (l.hide(), b.show(), v.show(), y.change()) : "PKCS5" === e ? (l.show(), b.show(), v.hide(), K.show()) : (l.hide(), b.hide(), v.show())
    }), d.change(), $('[data-toggle="key-type"]').each(function () {
        var e = $(this), t = $(e.data("target"));
        e.change(function () {
            t.toggle("pem_text" === e.val())
        }), e.change()
    }), $(window).on("methodLoad", function () {
        Object.keys(s).forEach(function (e) {
            KJUR.asn1.x509.OID.name2oidList[e] = s[e]
        }), Object.keys(c).forEach(function (e) {
            KJUR.crypto.OID.oidhex2name[e] = c[e]
        });
        var e = KJUR.crypto.ECDSA.getName;
        KJUR.crypto.ECDSA.getName = function (t) {
            return c[t] ? c[t] : e(t)
        }, KJUR.crypto.ECParameterDB.regist("secp112r1", 112, "db7c2abf62e35e668076bead208b", "db7c2abf62e35e668076bead2088", "659ef8ba043916eede8911702b22", "db7c2abf62e35e7628dfac6561c5", "1", "09487239995a5ee76b55f9c2f098", "a89ce5af8724c0a23e0e0ff77500", [])
    });
    var w = $("#algorithm");
    if ("SHA256" === w.val()) {
        var m = ot.getQuery();
        if (!m.algorithm) return;
        algorithm = m.algorithm.replace("withECDSA", ""), w.find('option[value="' + algorithm + '"]').length && w.val(algorithm)
    }
}();
