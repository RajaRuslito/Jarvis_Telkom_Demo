create table mission_statement (
	job_id INT PRIMARY KEY UNIQUE not null,
	nama_job TEXT not null,
	deskripsi TEXT not null
);

create table job_req (
	job_id INT  not null,
	nama_job TEXT not null,
	deskripsi TEXT not null
);

create table job_pi (
	job_id INT  not null,
	nama_job TEXT not null,
	deskripsi TEXT not null
);

create table job_auth (
	job_id INT  not null,
	nama_job TEXT not null,
	deskripsi TEXT not null
);

CREATE TYPE account_roles AS ENUM (
	'User',
	'Admin',
	'Super Admin'
);

CREATE TABLE account (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	email VARCHAR NOT NULL CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password VARCHAR NOT NULL,
	roles account_roles NOT NULL
);

grant all privileges on table account to test_limto;
GRANT USAGE, SELECT ON SEQUENCE account_id_seq TO test_limto;



SELECT job_id, COUNT(*)
FROM job_req
GROUP BY job_id
HAVING COUNT(*) > 1;

DELETE FROM job_req
WHERE ctid NOT IN (
SELECT MIN(ctid)
FROM job_req
GROUP BY job_id
);

ALTER TABLE job_req ALTER COLUMN job_id SET NOT NULL;
ALTER TABLE job_req ADD CONSTRAINT job_id UNIQUE (job_id);
ALTER TABLE job_req ADD CONSTRAINT job_req_pkey PRIMARY KEY (job_id);


SELECT job_id, COUNT(*)
FROM mission_statement
GROUP BY job_id
HAVING COUNT(*) > 1;

DELETE FROM mission_statement
WHERE ctid NOT IN (
SELECT MIN(ctid)
FROM job_req
GROUP BY job_id
);

ALTER TABLE mission_statement ALTER COLUMN job_id SET NOT NULL;
ALTER TABLE mission_statement ADD CONSTRAINT job_id UNIQUE (job_id);
ALTER TABLE mission_statement ADD CONSTRAINT job_pi_pkey PRIMARY KEY (job_id);


SELECT job_id, COUNT(*)
FROM job_pi
GROUP BY job_id
HAVING COUNT(*) > 1;

DELETE FROM job_pi
WHERE ctid NOT IN (
SELECT MIN(ctid)
FROM job_req
GROUP BY job_id
);

ALTER TABLE job_pi ALTER COLUMN job_id SET NOT NULL;
ALTER TABLE job_pi ADD CONSTRAINT job_id UNIQUE (job_id);
ALTER TABLE job_pi ADD CONSTRAINT job_pi_pkey PRIMARY KEY (job_id);


SELECT job_id, COUNT(*)
FROM job_auth
GROUP BY job_id
HAVING COUNT(*) > 1;

DELETE FROM job_auth
WHERE ctid NOT IN (
SELECT MIN(ctid)
FROM job_req
GROUP BY job_id
);

ALTER TABLE job_auth ALTER COLUMN job_id SET NOT NULL;
ALTER TABLE job_auth ADD CONSTRAINT job_id UNIQUE (job_id);
ALTER TABLE job_auth ADD CONSTRAINT job_auth_pkey PRIMARY KEY (job_id);


INSERT INTO mission_statement (job_id, nama_job, deskripsi) VALUES 
(1,'Senior General Manager Telkom Corporate University','Bertanggung jawab untuk memastikan terlaksananya pengelolaan learning, innovation, and research dalam lingkup Telkom Group; berdasarkan strategi dan arahan bisnis yang telah ditentukan.'),
(2,'Senior Manager School of Digital Infrastructure','Bertanggung jawab atas perencanaan dan pengawalan proses pengembangan kapabilitas karyawan anak Perusahaan di bawah portofolio digital infrastructure yang dilakukan sesuai dengan aturan yang berlaku, antara lain merencanakan desain, mengembangkan materi pembelajaran yang terstruktur dan berkualitas, menerbitkan dokumen kesepakatan dengan anak perusahaan, serta mengelola proses administrasi terkait.'),
(3,'Manager Solution Planning','Melakukan fungsi Solution Planning untuk mendukung pencapaian performansi'),
(4,'OFF 2 Solution Planning','Melakukan fungsi Solution Planning untuk mendukung pencapaian performansi'),
(5,'Manager Learning Design & Development Digital Infrastructure','Melakukan fungsi Learning Design & Development Digital Infrastructure untuk mendukung pencapaian performansi'),
(6,'OFF 2 Learning Design & Development Digital Infrastructure','Melakukan fungsi Learning Design & Development Digital Infrastructure untuk mendukung pencapaian performansi'),
(7,'OFF 3 Learning Design & Development Digital Infrastructure','Melakukan fungsi Learning Design & Development Digital Infrastructure untuk mendukung pencapaian performansi'),
(8,'Manager Operation Support','Melakukan fungsi Operation Support untuk mendukung pencapaian performansi'),
(9,'OFF 3 Operation Support','Melakukan fungsi Operation Support untuk mendukung pencapaian performansi'),
(10,'Senior Manager School of Digital Service & New Play','Bertanggung jawab atas perencanaan dan pengawalan proses pengembangan kapabilitas karyawan anak Perusahaan yang berada di bawah portofolio Integrated B2C, B2B ICT Sevice, New Play dan termasuk karyawan afiliasi, yang dilakukan sesuai dengan aturan yang berlaku, antara lain merencanakan desain, mengembangkan materi pembelajaran yang terstruktur dan berkualias, menerbitkan dokumen kesepakatan, serta mengelola proses administrasi terkait.'),
(11,'Manager Solution Planning','Melakukan fungsi Solution Planning untuk mendukung pencapaian performansi'),
(12,'OFF 1 Solution Planning','Melakukan fungsi Solution Planning untuk mendukung pencapaian performansi'),
(13,'OFF 3 Solution Planning','Melakukan fungsi Solution Planning untuk mendukung pencapaian performansi'),
(14,'Manager Learning Design & Development Integrated B2C-B2B & New Play','Melakukan fungsi Learning Design & Development Integrated B2C-B2B & New Play untuk mendukung pencapaian performansi'),
(15,'OFF 1 Learning Design & Development B2C-B2B & New Play','Melakukan fungsi Learning Design & Development Integrated B2C-B2B & New Play untuk mendukung pencapaian performansi'),
(16,'OFF 3 Learning Design & Development B2C-B2B & New Play','Melakukan fungsi Learning Design & Development Integrated B2C-B2B & New Play untuk mendukung pencapaian performansi'),
(17,'Manager Operation Support','Melakukan fungsi Operation Support untuk mendukung pencapaian performansi'),
(18,'OFF 1 Operation Support','Melakukan fungsi Operation Support untuk mendukung pencapaian performansi'),
(19,'OFF 3 Operation Support','Melakukan fungsi Operation Support untuk mendukung pencapaian performansi'),
(20,'Knowledge Management & Digitization Tribe Leader','Bertanggung jawab atas pengelolaan proses digitisasi sistem teknologi dan pengelolaan Knowledge Management untuk meningkatkan kualitas dan experience penyelenggaraan learning, research, and innovation, baik untuk kebutuhan saat ini maupun yang akan datang di lingkungan Telkom Group.'),
(21,'OFF 1 Tribe Support Knowledge Management & Digitization','Melakukan fungsi Tribe Support Knowledge Management & Digitization untuk mendukung pencapaian performansi'),
(22,'OFF 1 Tribe Support Knowledge Management & Digitization','Melakukan fungsi Tribe Support Knowledge Management & Digitization untuk mendukung pencapaian performansi'),
(23,'OFF 3 Tribe Support Knowledge Management & Digitization','Melakukan fungsi Tribe Support Knowledge Management & Digitization untuk mendukung pencapaian performansi'),
(24,'Senior Manager School of Enabler & Corporate Transformation','Bertanggung jawab atas perencanaan dan pengawalan proses pengembangan kapabilitas enabler and corporate transformation bagi seluruh karyawan Telkom di setiap Unit Kerja sesuai dengan lingkup yang dikelola, antara lain merencanakan desain dan mengembangkan materi pembelajaran yang terstruktur, berkualitas, serta berdampak terhadap peningkatan performansi bisnis.'),
(25,'Manager Planning & Support ','Melakukan fungsi Planning & Support untuk mendukung pencapaian performansi'),
(26,'OFF 1 Planning & Support','Melakukan fungsi Planning & Support untuk mendukung pencapaian performansi'),
(27,'OFF 2 Planning & Support','Melakukan fungsi Planning & Support untuk mendukung pencapaian performansi'),
(28,'Manager Learning Design Enabler & Corporate Transformation','Melakukan fungsi Learning Design Enabler & Corporate Transformation untuk mendukung pencapaian perfomansi'),
(29,'OFF 2 Learning Experience Enabler & Corporate Transformation','Melakukan fungsi Learning Design Enabler & Corporate Transformation untuk mendukung pencapaian perfomansi'),
(30,'OFF 3 Learning Experience Enabler & Corporate Transformation','Melakukan fungsi Learning Design Enabler & Corporate Transformation untuk mendukung pencapaian perfomansi'),
(31,'Manager Learning Development General Affair','Melakukan fungsi Learning Development General Affair untuk mendukung pencapaian performansi'),
(32,'OFF 1 Learning Development General Affair','Melakukan fungsi Learning Development General Affair untuk mendukung pencapaian performansi'),
(33,'OFF 3 Learning Development General Affair','Melakukan fungsi Learning Development General Affair untuk mendukung pencapaian performansi'),
(34,'Manager Learning Development Corporate Transformation','Melakukan fungsi Learning Development Corporate Transformation untuk mendukung pencapaian performansi'),
(35,'OFF 1 Learning Development Corporate Transformation','Melakukan fungsi Learning Development Corporate Transformation untuk mendukung pencapaian performansi'),
(36,'Senior Manager School of Go-to-Market','Bertanggung jawab atas perencanaan dan pengawalan proses pengembangan kapabilitas go-to-market dan product/service bagi seluruh karyawan Telkom di setiap Unit Kerja sesuai dengan lingkup yang dikeloola, antara lain merencanakan desain dan mengembangkan materi pembelajaran dalam suatu tahapan pembelajaran yang terstruktur, berkualitas, serta berdampak terhadap peningkatan performansi bisnis.'),
(37,'Manager Planning & Support ','Melakukan fungsi Planning & Support untuk mendukung pencapaian performansi'),
(38,'OFF 1 Planning & Support','Melakukan fungsi Planning & Support untuk mendukung pencapaian performansi'),
(39,'OFF 3 Planning & Support','Melakukan fungsi Planning & Support untuk mendukung pencapaian performansi'),
(40,'Manager Learning Design GTM, Product, & Service','Melakukan fungsi Learning Design GTM, Product & Service untuk mendukung pencapaian performansi'),
(41,'OFF 1 Learning Design GTM, Product, & Service','Melakukan fungsi Learning Design GTM, Product & Service untuk mendukung pencapaian performansi'),
(42,'OFF 2 Learning Design GTM, Product, & Service','Melakukan fungsi Learning Design GTM, Product & Service untuk mendukung pencapaian performansi'),
(43,'Manager Learning Development GTM','Melakukan fungsi Learning Development GTM untuk mendukung pencapaian performansi'),
(44,'OFF 2 Learning Development GTM','Melakukan fungsi Learning Development GTM untuk mendukung pencapaian performansi'),
(45,'OFF 3 Learning Development GTM','Melakukan fungsi Learning Development GTM untuk mendukung pencapaian performansi'),
(46,'Manager Learning Development Product & Service','Melakukan fungsi Learning Development Product & Service untuk mendukung pencapaian performansi'),
(47,'OFF 1 Learning Development Product & Service','Melakukan fungsi Learning Development Product & Service untuk mendukung pencapaian performansi'),
(48,'Senior Manager Research & Innovation Management','Bertanggung jawab atas pengelolaan research agenda dan inovasi, antara lain identifikasi kebutuhan dan strategi pengelolaan yang selaras dengan kebutuhan Perusahaan dan berdampak terhadap bisnis Telkom Group.'),
(49,'Manager Innovation Management','Melakukan fungsi Innovation Management untuk mendukung pencapaian performansi'),
(50,'OFF 1 Innovation Management','Melakukan fungsi Innovation Management untuk mendukung pencapaian performansi'),
(51,'Manager Research Management','Melakukan fungsi Research Management untuk mendukung pencapaian performansi'),
(52,'OFF 2 Research Management','Melakukan fungsi Research Management untuk mendukung pencapaian performansi'),
(53,'Manager Research & Innovation Strategy','Melakukan fungsi Research & Innovation Strategy untuk mendukung pencapaian performansi'),
(54,'OFF 1 Research & Innovation Strategy','Melakukan fungsi Research & Innovation Strategy untuk mendukung pencapaian performansi'),
(55,'OFF 3 Research & Innovation Strategy','Melakukan fungsi Research & Innovation Strategy untuk mendukung pencapaian performansi'),
(56,'Deputy Senior General Manager Telkom Corporate University','Bertanggung jawab untuk mengelola aktivitas penyelenggaraan Telkom Corporate University, dan untuk memastikan terlaksananya pengelolaan dan proses koordinasi pada lingkup operasionalnya, maka ditetapkan pembagian fokus tugas dan tanggung jawab antara SMG Telkom Corporate University dan Deputy SGM Telkom Corporate University.'),
(57,'Senior Manager Learning, Innovation, & Research Fulfillment','Bertanggung jawab atas keberhasilan pelaksanaan delivery and fulfillment atas proses learning, innovation, and research, serta improvement learning, innovation and research di lingkup Telkom Group sehingga mampu memberikan tingkat kepuasan yang optimal bagi seluruh karyawan Telkom Group dan pelanggan di luar Telkom Group.'),
(58,'Manager Learning Operation & Support','Melakukan fungsi Learning Operation & Support untuk mendukung pencapaian performansi'),
(59,'OFF 1 Learning Delivery Fulfillment','Melakukan fungsi Learning Delivery Fulfillment untuk mendukung pencapaian performansi'),
(60,'OFF 2 Delivery Administration','Melakukan fungsi Delivery Administration untuk mendukung pencapaian performansi'),
(61,'Manager TCU Area','Melakukan fungsi TCU Area untuk mendukung pencapaian performansi'),
(62,'OFF 1 Digital Learning Area I','Melakukan fungsi Digital Learning Area I untuk mendukung pencapaian performansi'),
(63,'OFF 1 Digital Learning Area II','Melakukan fungsi Digital Learning Area II untuk mendukung pencapaian performansi'),
(64,'OFF 2 Digital Learning Area II','Melakukan fungsi Digital Learning Area II untuk mendukung pencapaian performansi'),
(65,'OFF 1 Digital Learning Area III','Melakukan fungsi Digital Learning Area III untuk mendukung pencapaian performansi'),
(66,'Manager Subsidiary Fulfillment Support','Melakukan fungsi Subsidiary Fulfillment Support untuk mendukung pencapaian performansi '),
(67,'OFF 3 Subsidiary Fulfillment Support','Melakukan fungsi Subsidiary Fulfillment Support untuk mendukung pencapaian performansi '),
(68,'Manager Customer Effectiveness Management','Melakukan fungsi Customer Effectiveness Management untuk mendukung pencapaian performansi'),
(69,'OFF 3 Learning Impact Measurement Analyst','Melakukan fungsi Learning Impact Measurement Analyst untuk mendukung pencapaian performansi'),
(70,'Senior Manager Planning & Controlling','Bertanggung jawab atas pengelolaan aspek legal, kesekretariatan, workforce management, operasional, dan pemeliharaan aset dan fasilitas, serta pengelolaan logistic and procurement untuk memastikan kelancaran operasional organisasi Telkom Corporate University Center.'),
(71,'Manager Business Planning & Performance','Melakukan fungsi Business Planning & Performance untuk mendukung pencapaian performansi'),
(72,'OFF 1 Business Planning, Performance, & Data Management ','Melakukan fungsi Business Planning, Performance, & Data Management untuk mendukung pencapaian performansi'),
(73,'Manager Budget Planning & Controlling','Melakukan fungsi Budget Planning & Controlling untuk mendukung pencapaian performansi'),
(74,'OFF 1 Budget Planning & Controlling','Melakukan fungsi Budget Planning & Controlling untuk mendukung pencapaian performansi'),
(75,'Manager Risk, Quality, & Compliance Management','Melakukan fungsi Risk, Quality, & Compliance Management untuk mendukung pencapaian performansi'),
(76,'OFF 2 Change & Quality Management','Melakukan fungsi Change & Quality Management untuk mendukung pencapaian performansi'),
(77,'OFF 2 Product & Service Quality Control','Melakukan fungsi Product & Service Quality Control untuk mendukung pencapaian performansi'),
(78,'Manager Solution Management','Melakukan fungsi Solution Management untuk mendukung pencapaian performansi'),
(79,'OFF 2 Solution Management','Melakukan fungsi Solution Management untuk mendukung pencapaian performansi'),
(80,'Senior Manager General Support','Bertanggung jawab atas pengelolaan aspek legal, kesekretariatan, workforce management, operasional, dan pemeliharaan aset dan fasilitas, serta pengelolaan logistic and procurement untuk memastikan kelancaran operasional organisasi Telkom Corporate University Center.'),
(81,'Manager Secretariate, Administration, & Communication','Melakukan fungsi Secretariate, Administration, & Communication untuk mendukung pencapaian performansi'),
(82,'OFF 1 Communication','Melakukan fungsi Communication untuk mendukung pencapaian performansi'),
(83,'OFF 1 Secretariate & Administration','Melakukan fungsi Secretariate & Administration untuk mendukung pencapaian performansi'),
(84,'Manager Logistic & Procurement','Melakukan fungsi Logistic & Procurement untuk mendukung pencapaian performansi'),
(85,'OFF 1 Logistic & Procurement','Melakukan fungsi Logistic & Procurement untuk mendukung pencapaian performansi'),
(86,'OFF 1 Owner Estimate Procurement','Melakukan fungsi Owner Estimate Procurement untuk mendukung pencapaian performansi'),
(87,'Manager Assets & Facility Management','Melakukan fungsi Assets & Facility Management untuk mendukung pencapaian performansi'),
(88,'OFF 3 Asset & Facility Administration','Melakukan fungsi Assets & Facility Management untuk mendukung pencapaian performansi'),
(89,'Manager Legal, Workforce, & Outsource Management','Melakukan fungsi Legal, Workforce, & Outsource Management untuk mendukung pencapaian performansi'),
(90,'OFF 2 Workforce Data and Reporting','Melakukan fungsi Workforce Data and Reporting untuk mendukung pencapaian performansi'),
(91,'OFF 3 Legal & Compliance','Melakukan fungsi Legal & Compliance untuk mendukung pencapaian performansi'),
(92,'OFF 3 Outsource Data and Reporting','Melakukan fungsi Outsource Data and Reporting untuk mendukung pencapaian performansi'),
(93,'Senior Manager Expert Management','Bertanggung jawab atas pengelolaan expert, antara lain mengidentifikasi, menetapkan, mengembangkan, mengatur penugasan, serta evaluasi kinerja para expert dalam proses pemenuhan kebutuhan learning, research, and innovation untuk kebutuhan Telkom Group.'),
(94,'Manager Expert Planning & Evaluation','Melakukan fungsi Expert Planning & Evaluation untuk mendukung pencapaian performansi'),
(95,'OFF 1 Expert Planning','Melakukan fungsi Expert Planning & Evaluation untuk mendukung pencapaian performansi'),
(96,'OFF 2 Expert Evaluation','Melakukan fungsi Expert Evaluation untuk mendukung pencapaian performansi'),
(97,'Manager Expert Development','Melakukan fungsi Expert Development untuk mendukung pencapaian performansi'),
(98,'OFF 1 Expert Development','Melakukan fungsi Expert Development untuk mendukung pencapaian performansi'),
(99,'Manager Expert Assignment','Melakukan fungsi Expert Assignment untuk mendukung pencapaian performansi'),
(100,'OFF 1 Expert Assignment','Melakukan fungsi Expert Assignment untuk mendukung pencapaian performansi');