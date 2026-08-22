const ExcelJS = require('exceljs');
const { Commission, User, Payment } = require('../../models');

const commissionIncludes = [
  { model: User, as: 'Referrer', attributes: ['id', 'full_name', 'phone'] },
  { model: User, as: 'ReferredUser', attributes: ['id', 'full_name', 'phone'] },
  { model: Payment, attributes: ['id', 'amount', 'razorpay_payment_id', 'razorpay_order_id', 'payment_status', 'created_at'] }
];

const formatDate = (value) => value ? new Date(value).toLocaleString('en-IN') : '';
const safeFileDate = () => new Date().toISOString().slice(0, 10);
const safeFilenamePart = (value, fallback) => String(value || fallback)
  .trim()
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80) || fallback;

const buildWorkbook = async ({ title, columns, rows, summary = [] }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dev Darshan Live';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Commission Report', { views: [{ state: 'frozen', ySplit: 4 }] });

  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell('A1').value = title;
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.mergeCells(2, 1, 2, columns.length);
  sheet.getCell('A2').value = `Generated: ${formatDate(new Date())}`;
  sheet.getCell('A2').font = { italic: true, color: { argb: 'FF4B5563' } };

  summary.forEach(([label, value], index) => {
    const row = 3 + Math.floor(index / 2);
    const column = (index % 2) * Math.ceil(columns.length / 2) + 1;
    sheet.getCell(row, column).value = label;
    sheet.getCell(row, column).font = { bold: true };
    sheet.getCell(row, column + 1).value = value;
  });

  const headerRow = 3 + Math.ceil(summary.length / 2) + 1;
  sheet.getRow(headerRow).values = columns.map((column) => column.header);
  sheet.getRow(headerRow).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(headerRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } };
  sheet.getRow(headerRow).alignment = { vertical: 'middle', wrapText: true };

  rows.forEach((row) => sheet.addRow(columns.map((column) => row[column.key])));
  const firstDataRow = headerRow + 1;
  const lastDataRow = Math.max(firstDataRow, sheet.rowCount);
  for (let row = firstDataRow; row <= lastDataRow; row += 1) {
    if (row % 2 === 0) sheet.getRow(row).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
  }
  columns.forEach((column, index) => {
    const worksheetColumn = sheet.getColumn(index + 1);
    worksheetColumn.width = column.width || 20;
    if (column.currency) worksheetColumn.numFmt = '₹#,##0.00';
    if (column.percent) worksheetColumn.numFmt = '0.00%';
  });
  sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: columns.length } };
  return workbook;
};

const sendWorkbook = async (res, filename, workbook) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
};

const getReports = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'full_name', 'phone'], order: [['full_name', 'ASC']] });
    res.render('reports/index', { activePage: 'reports', users, error: req.query.error || null });
  } catch (error) {
    console.error('getReports error:', error);
    res.status(500).send('Unable to load reports.');
  }
};

const downloadAllCommissions = async (req, res) => {
  try {
    const commissions = await Commission.findAll({ order: [['created_at', 'DESC']], include: commissionIncludes });
    const rows = commissions.map((commission) => ({
      date: formatDate(commission.created_at),
      referrer: commission.Referrer?.full_name || '',
      referrerPhone: commission.Referrer?.phone || '',
      referredUser: commission.ReferredUser?.full_name || '',
      referredPhone: commission.ReferredUser?.phone || '',
      paymentAmount: Number(commission.Payment?.amount || 0),
      commissionPercent: Number(commission.commission_percentage || 0) / 100,
      commissionAmount: Number(commission.amount || 0),
      paymentStatus: commission.Payment?.payment_status || '',
      paymentId: commission.Payment?.razorpay_payment_id || '',
      orderId: commission.Payment?.razorpay_order_id || ''
    }));
    const totalCommission = rows.reduce((total, row) => total + row.commissionAmount, 0);
    const workbook = await buildWorkbook({
      title: 'All User Commission Report',
      summary: [['Total records', rows.length], ['Total commission', totalCommission]],
      columns: [
        { header: 'Date', key: 'date', width: 22 }, { header: 'Referrer', key: 'referrer', width: 24 }, { header: 'Referrer Mobile', key: 'referrerPhone', width: 17 },
        { header: 'Referred User', key: 'referredUser', width: 24 }, { header: 'Referred Mobile', key: 'referredPhone', width: 17 }, { header: 'Payment Amount', key: 'paymentAmount', width: 16, currency: true },
        { header: 'Commission %', key: 'commissionPercent', width: 14, percent: true }, { header: 'Commission Amount', key: 'commissionAmount', width: 18, currency: true }, { header: 'Payment Status', key: 'paymentStatus', width: 15 },
        { header: 'Razorpay Payment ID', key: 'paymentId', width: 25 }, { header: 'Razorpay Order ID', key: 'orderId', width: 25 }
      ],
      rows
    });
    await sendWorkbook(res, `all-user-commission-report-${safeFileDate()}.xlsx`, workbook);
  } catch (error) {
    console.error('downloadAllCommissions error:', error);
    res.status(500).send('Unable to generate the all-user commission report.');
  }
};

const downloadUserCommission = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, { attributes: ['id', 'full_name', 'phone'] });
    if (!user) return res.redirect('/admin/reports?error=User+not+found');
    const commissions = await Commission.findAll({ where: { referrer_id: user.id }, order: [['created_at', 'DESC']], include: commissionIncludes });
    const rows = commissions.map((commission) => ({
      date: formatDate(commission.created_at), referredUser: commission.ReferredUser?.full_name || '', referredPhone: commission.ReferredUser?.phone || '',
      paymentAmount: Number(commission.Payment?.amount || 0), commissionPercent: Number(commission.commission_percentage || 0) / 100,
      commissionAmount: Number(commission.amount || 0), paymentStatus: commission.Payment?.payment_status || '', paymentId: commission.Payment?.razorpay_payment_id || ''
    }));
    const totalCommission = rows.reduce((total, row) => total + row.commissionAmount, 0);
    const workbook = await buildWorkbook({
      title: `Commission Report — ${user.full_name}`,
      summary: [['Referrer', user.full_name], ['Mobile', user.phone], ['Total records', rows.length], ['Total commission', totalCommission]],
      columns: [
        { header: 'Date', key: 'date', width: 22 }, { header: 'Referred User', key: 'referredUser', width: 24 }, { header: 'Referred Mobile', key: 'referredPhone', width: 17 },
        { header: 'Payment Amount', key: 'paymentAmount', width: 16, currency: true }, { header: 'Commission %', key: 'commissionPercent', width: 14, percent: true },
        { header: 'Commission Amount', key: 'commissionAmount', width: 18, currency: true }, { header: 'Payment Status', key: 'paymentStatus', width: 15 }, { header: 'Razorpay Payment ID', key: 'paymentId', width: 25 }
      ],
      rows
    });
    const username = safeFilenamePart(user.full_name, `user-${user.id}`);
    const mobile = safeFilenamePart(user.phone, 'mobile');
    await sendWorkbook(res, `${username}-${mobile}-commission-report-${safeFileDate()}.xlsx`, workbook);
  } catch (error) {
    console.error('downloadUserCommission error:', error);
    res.status(500).send('Unable to generate the user commission report.');
  }
};

module.exports = { getReports, downloadAllCommissions, downloadUserCommission };
