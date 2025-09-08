logic:
Monitoring dan Evaluasi
Daftar pekerjaan diambil dari usulan yang sudah diverifikasi??







others:
-ikuti ini sebagai acuan untuk ukuran ratio dari font size hingga ukuran content-contentnya:
	+src\app\monitoring-evaluasi\page.tsx
	+src\components\monitoring\project-list.tsx
	+src\components\monitoring\summary-cards.tsx




pada bagian informasi umum proyek dan inforamasi kontrak & anggaran nya itu bisa diisi dan otomatis akan menyimpan data tersebut otomatis ke db(tanpa perlu diki)




untuk catatan tambahan, pada table monitoring dan evaluasi pekerjaan terdapat tombol tambah kegiatan kan. nahh,Ketika tombol tambah kegiatan diklik maka akan memunculkan modal dengan input field pekerjaan dengan masing-masing list sub-pekerjaan, user bisa menambah data pekerjaan dan bisa menambah data sub-pekerjaannya. nantinya data tersebut akan muncul sebagai isi dari kolom uraian pekerjaan dan kolom bobot. lalu isi tersebut pada data pekerjaan yang digaris bawahi bisa dikilik untuk memunculkan modal untuk updatenya. lalu pada input-input isian dari kolom tanggal-nya itu bisa di input oleh user.


----------------------------------------------------
ok pada tabel monitoring dan evaluasi, baris pada uraian pekerjaannya itu tidak ada bobot dan diblock saja, jadi yang bisa diisi bobot itu hanya sub pekerjaannya saja. untuk sub pekerjaan pada bagian kolom tanggalnya itu  tolong buat 2 baris. untuk cell pada baris pertama warnanya adalah ini #BFDBFE,dan untuk cell baris kedua warnanya adalah ini #FFC928. tapi untuk pertama kali menginput tampilan seperti yang sekarang saja dengan menggunakan symbol ini -.

pokoknya tolong buat sama persis dengan yang di figma ini https://www.figma.com/design/b20D1t97KXTnmihl9qnrme/SIGER?node-id=195-8153&m=dev
-----------------------------------------------------

!!!disini

untuk cell aktivitas utamanya saya ingin, itu bisa diklik dan menampilkan modal untuk mengedit dan menghapus data tersebut. dan juga tolong ubah data aktivitas utamanya itu tidak perlu ada field bobot, dan tambahakan pada data sub aktivitas field ini: satuan, volume kontrak, volume MC 0, bobot mc 0 dalam persen
------------
ok sudah benar, lalu saya ingin range tanggalnya itu diambil dari tanggalKontrak hingga akhirKontrak yang ada pada projectSchema, lalu data kumulatif rencana dan kumulatif realisasi itu adalah penjumlahan datanya, sedangkan kumulatif deviasi itu adalah kumulatif rencana dikurangi dengan kumulatif realisasi. saya ingin juga data kumulatif rencana,realisasi, dan deviasi itu disimpan didalam db. saya juga telah mencoba kode yang sekarang, Ketika saya mengsisi salah satu cell pada salah satu kolom tanggalnya itu saya masih mendapatkan error ini:
{"success":false,"error":"Failed to update schedule"}. saya ingin Ketika saya mengsisi salah satu cell pada salah satu kolom tanggalnya, data kumulatif nya itu ikut berubah menyesuaikan dan semua data yang berubah nya itu langsung terupdate di db 
-------------


ok now i want you to create the remaining component which hasnt been impemented yet(follow exactly as the figma shown),  for ai insight and adendum please use dummy data. and for others use the data related from db, i want the chart and progres and deviasi terhadap targe data to be slightly real time, so please refetch per 5s 


--------------------------------
for input Volume Target (Volume Satuan),Volume (Volume Satuan),Tanggal Mulai,Tanggal Selesai,Waktu Selesai (Hari) user can input and it will autosave on the db(please follow )
	pelaksaan column is statis, but ont the righs side table is input form and automatically save to db()

--------------------------------

https://www.figma.com/design/b20D1t97KXTnmihl9qnrme/SIGER?node-id=195-10197&t=hMz3lzXHACOpeeTt-11

i want you to implement that figma link. please create the be and fe and i want you to create the seeder based on the dummy data that shown on that figma.

for the first time it will fetch all the data from be.

when user click tambah material, it will trigger the modal form, with one input field which is input filed jenis material. if user click simpan, application will show the ui like on the figma but with empty data. only jenis material that filled. 


for inputs Jenis material, volume satuan(consistf of 2 value:m3 and buah), Volume Target,Tanggal Mulai,Tanggal Selesai,Waktu Selesai (Hari) user can input and it will autosave on the db(please use  input field on  informasi umum proyek tab as referemce). the volume data is the latest data of realisasi kumulatif of the table progres pasir.

the value of pelaksanaan column is statis, but on the right side of pelaksaan column is input form and it is automatically save to db like ActivityScheduleTable(use ActivityScheduleTable as reference). the time range is from Tanggal Mulai to Tanggal Selesai. rencana value is from volume target, so it will disabled. rencana kumulatif is sum of rencana each day,it also need to be disabled. tercapai consist 2 possibilty Y with green and T with red(Y if on that day realisasi < rencana) this also disabled. so user can only input the data on realisai and realisasi kumulatif row. when tanggal mulai changes or tanggal selesai changes the column time will also adjust the ranges corresponding to that changes. and also if volume target changes the rencana and rencana kumulatif will also changes, and the tercapai values will also adjust to it.

and for the chart you can use SCurveChart as reference

----------------------------------
begini saja jika misalkan perubahan tanggal nya itu masih dalam range tanggal data sebelumnya maka extend saja, tapi jika perubahan tanggal nya ada yang 
-------------------------------------
jadi ketika user mengisi nilai volume, Tanggal Mulai, dan Tanggal Selesai, tolong generate dulu semua data di table schedules untuk range tersebut, yang mana nilai rencana berasal dari nilai volume(tiap hari sama nilainya), dan tolong juga tunjukkan bahwa row ini itu disabled entah warnanya dubah atau apapun itu. lalu untuk row Rencana Akumulasi adalah jumlah nilai rencana per harinya. lalu untuk row Tercapai terdiri dari 2 kemungkinan Y dengan warna hijau dan T dengan warna merah (Y jika pada hari tersebut realisasi < rencana) ini juga dinonaktifkan. Jadi pengguna hanya dapat menginput data pada baris realisasi untuk baris realisasi akumulasi nya adalah pertambahan dari nilai realisai tiap harinya. Dan jika target volume berubah, nilai-nilai pada rencana dan rencana Akumulasi juga akan berubah, dan tolong rekalkulasi nilai-nilai baris tercapai.
----------------------------------------
pada activity shchedule table tolong buat waktunya itu diambil dari input tanggal kontrak dan akhir kontrola pada tab data teknis. tolong juga buat agar input field tanggal kontrak dan akhir kontrak menggunakan kalender 
-----------------------
disini---
tolong munculkan tampilan tahunnya misal(pastiin dulu sistem pembagian minggunya gimana) 
---------------------
**untuk api mobile pelaksanaan
note: image nya belum

-tolong buat satu tabel bernama daily_sub_activities. tabel ini memiliki atrribtue: id, sub_activities_id, koordinat(bertipe json), catatan_kegiatan, file(bertipe json), progres_realisasi_per_hari, tanggal_progres, created_at, updated_at

-tolong buatkan satu api get /full-projects untuk mengambil data semua projek, beserta aktivitasnya dan sub aktivitasnya, tapi pertama tolong buat example response dari api yang akan dibuat terlebih dahulu.

-tolong buatkan api put /daily-update pada folder sub, api ini akan memberkan payload ini:
{
	sub_activities_id:
	koordinat:{

	},
	catatan_kegiatan:{

	},
	tanggal_progres:{

	},
	progres_realisasi_per_hari:{

	},
	files:{
		{
			file:"",
			path:""
		},
		{
			file:"",
			path:""
		},

	}

}



fungsi dari api tersebut itu adalah mengupdate progres realisai pada minggu tertent pada tabel sub_activities  dan menambahkan daily_sub_activities pada tanngal tertentu. jadi pertama untuk mengupdate progres realisasi cek dulu tanggal tersebut ada di minggu yang mana, lalu jika sudah dapat datanya maka tambahkan kedalam progres realisasinya. pastikan bahwa tampilan activity schedule table datanya akan terupdate juga dengan merfecth ulang api nya dalam interval 15 detik.

-buatkan api get /latest-daily-sub-activities
api ini akan menampilkan list data daily-sub-activities dengan tanggal_progres paling baru, untuk satu hari yang sama datanya harus 1

--disini
-tolong buatkan juga api untuk list daily-update-schedule, lengkap dengan pagination,filter,sorting, dan searching

-tolong buatkan api untuk mengecek apakah pad

-tolong buatkan api untuk user dan tolong pada tabel daily-sub-activities tambahkan id user sesuaikan untuk bagian kode yang terkait

---------------------------
**untuk tambah usulan kegiatan

https://www.figma.com/design/b20D1t97KXTnmihl9qnrme/SIGER?node-id=195-17102&m=dev

tolong implementasi ui diatas, untuk readiness gunakan dummy data saja dulu. buat be dan fe nya

------------------------------
**pembagian minggu pada activity schedule table
tolong ubah aturan pembagian minggunya menggunakan aturan berikut:

Aturan pembagian minggu per bulan (tahun apa pun)

Gunakan minggu = Senin–Minggu.

Tulis label minggu sebagai dd–dd (dua digit, leading zero).

Jika satu minggu menyeberang bulan, jangan diduplikasi; tetapkan minggu ke bulan yang memiliki mayoritas hari (≥4 hari). Praktik cepat: ambil hari Kamis dari minggu tersebut; bulan tempat Kamis jatuh adalah pemilik minggu.

Susun daftar per bulan; tiap bulan berisi 4–5 minggu sesuai aturan di atas.

Validasi wajib (untuk tahun 2025)

Juni: 02–08, 09–15, 16–22, 23–29

Juli: 30–06, 07–13, 14–20, 21–27, 28–03

Agustus: 04–10, 11–17, 18–24, 25–31

September: 01–07, 08–14, 15–21, 22–28

ok lalu untuk data yang ditampilkan pada header tabelnya(front end) itu minggu ke 1 dan minggu terakhir nya itu mengikuti data tanggal kontrak dan akhir kontrak. misal data tanggal kontrak 22 mei 2025 dan akhir kontrak adalah 19 september maka data pembagian yang akan ditampilkannya dalah sebagai berikut:

Mei: 23-25, 26-01

Juni: 02–08, 09–15, 16–22, 23–29

Juli: 30–06, 07–13, 14–20, 21–27, 28–03

Agustus: 04–10, 11–17, 18–24, 25–31

September: 01–07, 08–14, 15–19


------------------------------------
untuk activity schedule table, cumulative nya itu

implementasi yang sekarang adalah seperti ini:

	juni(16–22)	23–29	30–06	07–13	14–20	21–27	28–03	04–10	11–17	18–24	25–31	01–07	08–08
progres rencana juni(11–15) : 10    
cumulative rencana juni(11–15) : 10

progres rencana juni(23–29):0
cumulative rencana juni(23–29):0

progres rencana juni(30–06):15
cumulative rencana juni(30–06):25

saya tidak ingin seperti itu, saya inginnya seperti ini, ini berlaku untuk realisasi dan deviasinya:
progres rencana juni(11–15) : 10    
cumulative rencana juni(11–15) : 10

progres rencana juni(23–29):0
cumulative rencana juni(23–29):10

progres rencana juni(30–06):15
cumulative rencana juni(30–06):25


---------------------------------
ok i want you to visualize cumulative rencana dan cumulative realisasi from material flow table in material chart, and on the chart dont forget to add filter by month like the table does
---------------------------------
