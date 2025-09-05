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

