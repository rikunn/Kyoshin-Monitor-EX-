(async () => {
    var map = L.map('map', {
        center: [35.5312, 137.1882],
        zoom: 5,
        zoomControl: false,
        maxZoom: 7.5,
        minZoom: 3,
    });
    var PolygonStyle = {
        "color": "#646464",
        "weight": 2,
        "fillColor": "#323232",
        "fillOpacity": 0.3,
    }

    //マップ設定   
    $.getJSON("https://raw.githubusercontent.com/rikunn/Kyoshin-Monitor-EX-/main/assets/EEWJapanMap(Correct).geojson", function (data1) {
        L.geoJSON(data1,
            {
                style: PolygonStyle,
                onEachFeature: function onEachFeature(
                    feature,
                    layer
                ) {
                    if (feature.properties && feature.properties.popupContent) {
                        layer.bindPopup(feature.properties.popupContent);
                    }
                }
            }
        ).addTo(map);
    });

    $.getJSON("https://raw.githubusercontent.com/rikunn/Kyoshin-Monitor-EX-/main/assets/EEwWorldMap(EX).geojson", function (data2) {
        L.geoJSON(data2,
            {
                style: PolygonStyle,
                onEachFeature: function onEachFeature(
                    feature,
                    layer
                ) {
                    if (feature.properties && feature.properties.popupContent) {
                        layer.bindPopup(feature.properties.popupContent);
                    }
                }
            }
        ).addTo(map);
    });

   // L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg', {
   //     attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
   // }).addTo(map);

    const table = await ImportTable();
 
    var pwave;
    var swave;
    var epicenter;
    var psCenter;
    var ew;

    var DateTime;
    var depth;
    var lat;
    var lon;
    var OriginTime;
    var eewEND;
    var eewText = "情報を取得しています。お待ちください...";
    var plum;
    var message;

    // P,S
    setInterval(() => {

        DateTime = new Date();
       // DateTime = new Date("2022/03/26 13:16:22");
        if (ew == true) {
            console.log("P,S");
            var time = DateTime - new Date(OriginTime);
            var min = time / 1000;

            //                    何秒立ってるか / 深さ
            var value = GetValue(table, depth, min);

            if (map && pwave) {
                map.removeLayer(pwave);
                pwave = null;
            }
            if (map && swave) {
                map.removeLayer(swave);
                swave = null;
            }
            if (map && epicenter) {
                map.removeLayer(epicenter);
                epicenter = null;
            }

            pwave = L.circle([0, 0], {
                radius: 0,
                color: '#00a0f4',
                fillColor: '#000000',
                fillOpacity: 0,
            }).addTo(map);

            swave = L.circle([0, 0], {
                radius: 0,
                color: '#ff5064',
                fillColor: '#f06464',
                fillOpacity: 0.1,
            }).addTo(map);

            epicenter = L.marker([0, 0], {
                icon: L.icon({
                    iconUrl: "assets/epicenter.png",
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(map)

            //震中設定
            epicenter.setLatLng(psCenter);

            //P波位置設定
            pwave.setLatLng(psCenter);
            //P波半径設定
            pwave.setRadius(value[0] * 1000);

            //S波位置設定
            swave.setLatLng(psCenter);
            //S波半径設定
            swave.setRadius(value[1] * 1000); 

            //震源が中心になるように
            var bounds = L.latLngBounds([psCenter], [psCenter]);
            map.fitBounds(bounds);

            //広がり具合でズームレベルを調整
            if (min > 0 && min < 12) {
                map.setZoom(7.5);
            }
            if (min > 12 && min < 24) {
                map.setZoom(7);
            }
            if (min > 24 && min < 36) {
                map.setZoom(6.5);
            }
            if (min > 36 && min < 48) {
                map.setZoom(6);
            }
            if (min > 48) {
                map.setZoom(6.5);
            }

        }
    }, 200);

    //eew get
    setInterval(() => {

        $.getJSON("http://svir.jp/eew/data.json", function (json) {
            console.log("svir eew get");
            OriginTime = json.Body.Earthquake.OriginTime;
            var time = DateTime - new Date(OriginTime);
            var min = Math.floor(time / 1000);
            if (min <= 240) {           

                if (json.Head.Status == "取消") {
                    eewText = "緊急地震速報は取り消されました。";
                    if (map && pwave) {
                        map.removeLayer(pwave);
                        pwave = null;
                    }
                    if (map && swave) {
                        map.removeLayer(swave);
                        swave = null;
                    }
                    if (map && epicenter) {
                        map.removeLayer(epicenter);
                        epicenter = null;
                    }
       psCenter = new L.LatLng(35.5312, 137.1882);
                    if (ew == true) {
                        var bounds = L.latLngBounds([psCenter], [psCenter]);
                        map.fitBounds(bounds);
                        map.setZoom(5);
                        ew = false;
                    }
                }
                else if (json.Head.Status == "通常") {

                    ew = true;
                    depth = Number(json.Body.Earthquake.Hypocenter.Depth);
                    lat = Number(json.Body.Earthquake.Hypocenter.Lat);
                    lon = Number(json.Body.Earthquake.Hypocenter.Lon);
                    psCenter = new L.LatLng(lat, lon);

                    if (json.PLUMFlag == "0") {
                        plum = false;
                    }
                    else if (json.PLUMFlag == "1") {
                        plum = true;
                    }

                    if (json.EndFlag == "0") {
                        eewEND = false;
                    }
                    else {
                        eewEND = true;
                    }


                    if (plum == true) {
                        if (eewEND == true) {
                            message = "(PLUM報による仮定震源要素/最終)";
                        }
                        else {
                            message = "(PLUM報による仮定震源要素)";
                        }
                    }
                    else {
                        if (eewEND == true) {
                            message = "(最終)";
                        }
                        else {
                            message = "";
                        }
                    }

                    eewText = json.Head.Title + " 震源：" + json.Body.Earthquake.Hypocenter.Name + "　発生：" + getStringFromDate(new Date(OriginTime)) + "　最大震度：" + json.Body.Intensity.MaxInt + "　マグニチュード：" + json.Body.Earthquake.Magnitude + "　深さ：" + json.Body.Earthquake.Hypocenter.Depth + "km　第" + json.Head.Serial + "報" + message + "　情報：" + json.Body.Earthquake.Hypocenter.LandOrSea;
                }             
            }
            else {
                //未発表
                psCenter = new L.LatLng(35.5312, 137.1882);
                if (map && pwave) {
                    map.removeLayer(pwave);
                    pwave = null;
                }
                if (map && swave) {
                    map.removeLayer(swave);
                    swave = null;
                }
                if (map && epicenter) {
                    map.removeLayer(epicenter);
                    epicenter = null;
                }

                if (ew == true) {
                    var bounds = L.latLngBounds([psCenter], [psCenter]);
                    map.fitBounds(bounds);
                    map.setZoom(5);
                    ew = false;
                }
                eewText = "緊急地震速報は発表されていません";
            }            
        });

        document.getElementById('eewText').innerHTML = "<p>" + eewText + "</p>";

    }, 4000);

})()

async function ImportTable() {
    return (await axios.get("https://raw.githubusercontent.com/rikunn/Kyoshin-Monitor-EX-/main/tjma2001.txt")).data.trim().replace("\r", "").replace(/\x20+/g, " ").split("\n").map(x => {
    const s = x.split(" ");
    return {
      p: parseFloat(s[1]),
      s: parseFloat(s[3]),
      depth: parseInt(s[4]),
      distance: parseInt(s[5]),
    };
  });
}

function getStringFromDate(date) {

    var year_str = date.getFullYear();
    var month_str = 1 + date.getMonth();
    var day_str = date.getDate();
    var hour_str = date.getHours();
    var minute_str = date.getMinutes();
    var second_str = date.getSeconds();


    format_str = 'YYYY/MM/DD hh:mm:ss';
    format_str = format_str.replace(/YYYY/g, year_str);
    format_str = format_str.replace(/MM/g, month_str);
    format_str = format_str.replace(/DD/g, day_str);
    format_str = format_str.replace(/hh/g, hour_str);
    format_str = format_str.replace(/mm/g, minute_str);
    format_str = format_str.replace(/ss/g, second_str);

    return format_str;
};

function GetValue(table, depth, time) {
  if (depth > 700 || time > 2000) return [NaN, NaN];

  const values = table.filter(x => x.depth == depth);
  if (values.Length == 0) return [NaN, NaN];

  let p1 = values.filter(x => x.p <= time);
  p1 = p1[p1.length - 1];
  let p2 = values.filter(x => x.p >= time);
  p2 = p2[0];
  if (p1 == null || p2 == null) return [NaN, NaN];
  const p = (time - p1.p) / (p2.p - p1.p) * (p2.distance - p1.distance) + p1.distance;

  let s1 = values.filter(x => x.s <= time);
  s1 = s1[s1.length - 1];
  let s2 = values.filter(x => x.s >= time);
  s2 = s2[0];
  if (s1 == null || s2 == null) return [p, NaN];
  const s = (time - s1.s) / (s2.s - s1.s) * (s2.distance - s1.distance) + s1.distance;

  return [p, s];
}
