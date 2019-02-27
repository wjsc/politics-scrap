const cheerio = require('cheerio');
const trim = require('trim')

const removeTags = str => str.replace(/\<(.*)\>/g,"");
const removeSemicolon = str => str.replace(/;/g,"");
const removeDoubleSpace = str => str.replace(/\s+/g," ");
const emptyFilter = vector => !!vector || vector != ''
const replaceEmpty = str => str === '' ? '-' : str
const empty = '-'
const separator = '~';
module.exports = (html, url) => {
  const main = '#block-system-main';
  const $ = cheerio.load(html, { decodeEntities: false });
  const get = selector => $(selector, main).html() || empty;
  let data = {};
  
  data.url = url;
  data.nombre = get('.profile .name');
  if(!data.nombre) return null;
  data.posicion = trim(removeDoubleSpace(removeTags(get('.profile .position'))));
  data.customposicion = CustomPosicion(data.posicion);
  data.sexo = Sexo(data.posicion);
  data.bloque = removeTags(get('.profile .info-project .num-exp'));
  data.distrito = removeTags(get('.profile .info-project .status'));
  data.partido = get('.profile .info-project .text-project .pull-left');
  data.mandato = removeTags(get('.profile .info-project .type'));
  data.foto = $('.personal-info .photo img', main).attr('src') || empty;
  data.foto = data.foto.includes('man-silhouette.svg') ? 'Sin foto' : data.foto.split('?')[0];
  data.foto = data.foto.indexOf('/sites/default/files/')===0 ? 'http://directorio.directoriolegislativo.org' + data.foto : data.foto;
  data.nacimiento = removeTags(get('.personal-info .born'));
  data.ciudad_nacimiento = removeTags(get('.personal-info .city-born')).split(',').map(trim).filter(emptyFilter);
  data.estado_civil = removeTags(get('.personal-info .personal-status'));
  data.hijos = removeTags(get('.personal-info .sons')).replace(/\((.*)\)/g, '');
  data.direccion = get('.bloque_derecha .place .address');
  data.zona = get('.bloque_derecha .place .zone');
  data.telefono = $('.bloque_derecha .tel-number', main).eq(0).html() || empty;
  data.web = $('.bloque_derecha .tel-number a', main).html() || empty;
  data.secretario = get('.bloque_derecha .name-secretary');
  data.asesordeprensa = get('.bloque_derecha .asesordeprensa');
  data.twitter = $('.bloque_derecha .twitter-timeline', main).attr('href') || empty;
  data.especializacion = get('.bloque_central .activity .tab-content #home .specialization');
  data.empleadosacargo = get('.bloque_central .activity .tab-content #home .empleados-a-cargo-item');
  data.ubicacionenlista = get('.bloque_central .activity .tab-content #home .ubication .resultados-electorales-item');
  data.cantbancas = get('.bloque_central .activity .tab-content #home .seat .resultados-electorales-item');
  data.votos = get('.bloque_central .activity .tab-content #home .votes .resultados-electorales-item');
  data.ingresos = get('.bloque_central .activity .tab-content #menu1 .private-activity .ingr-activity .info-activity');
  data.estudios = Estudios($('.personal-info .academy .titles .estudio_alineado li', main) || empty);
  data.empleados = Empleados(get('.bloque_central .activity .tab-content #home .employees'));
  data.comisiones = Comisiones(get('.bloque_central .activity .tab-content #home .comission'));
  data.proyectos = Proyectos(get('.bloque_central .activity .tab-content #home .projects'));
  data.privado = Privado($('.bloque_central .activity .tab-content #menu1 .private-activity .info-activity', main).eq(0).html() || empty);
  data.privadoextra = Privado($('.bloque_central .activity .tab-content #menu1 .private-activity .info-activity', main).eq(1).html() || empty);
  data.mail ='Email Protected by CDN'; 
  data.publico = Publico(get('.bloque_central .activity .tab-content #menu1 .public-activity .info-activity'));
  Object.keys(data).filter(k => !Array.isArray(data[k])).forEach(k => data[k] = trim(replaceEmpty(removeTags(removeDoubleSpace(data[k])))));
  return data;
}

const CustomPosicion = posicion => 
['diputada nacional', 'diputado nacional', 'senadora nacional', 'senador nacional','diputada provincial', 'diputado provincial', 'senadora provincial', 'senador provincial'].includes(posicion.toLowerCase())
? 'Diputado/a o Senador/a'
  : posicion;

const Sexo = posicion => 
  ['diputada nacional', 'diputada provincial', 'senadora nacional', 'senadora provincial', 'legisladora provincial', 'legisladora', 'gobernadora', 'vicegobernadora', 'vicepresidenta de la nación', 'presidenta de la nación'].includes(posicion.toLowerCase()) ? 'F' 
  : ['diputado nacional', 'diputado provincial', 'senador nacional', 'senador provincial', 'legislador provincial', 'legislador', 'gobernador', 'vicegobernador', 'vicepresidente de la nación', 'presidente de la nación'].includes(posicion.toLowerCase()) ? 'M'
  : '-' ;

const Estudios = list => {
  const result = [];
  list.each( (index) => result.push(trim(list.eq(index).text())));
  return result;
} 

const Comisiones = html => {
  return html.split('<span class="titlenombrecomision comisiones nombrecomision">').map(element => element.split('</span>').map(removeTags).map(removeDoubleSpace).map(trim).filter(emptyFilter).join(' ')).slice(1);
} 

const Proyectos = html => {
  return html.split('<span class="grisimp">').map(element => element.split('</span>').map(removeTags).map(removeDoubleSpace).map(trim).filter(emptyFilter).join(' ')).slice(1);
} 

const Empleados = html => {
  return html.split('</span>').map(element => element.split('<span class="grisimp">').map(removeTags).map(removeDoubleSpace).map(removeSemicolon).map(trim).filter(emptyFilter).join(' ')).slice(0, -1);
} 

const Publico = html => {
  return html.split('</span>').map(element => element.split('<span class="extra-info">').map(removeTags).map(removeDoubleSpace).map(trim).join(' ')).filter(emptyFilter)
    .map(str => {
      const regex = /\(([\d]+)\-([\d]+)\)/;
      const job = str.replace(regex,'');
      const match = str.match(regex) || [];
      const from = match[1] || empty;
      const to = match[2] || empty;
      return job + separator + from + separator + to;
    });
} 

const Privado = html => {
  return html.split('</span>').map(element => element.split('<span class="grisimp">').map(removeTags).map(removeDoubleSpace).map(trim).filter(emptyFilter).join(' ')).slice(0, -1);
} 